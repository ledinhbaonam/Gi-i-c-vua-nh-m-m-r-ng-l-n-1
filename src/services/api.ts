import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { TournamentState } from '../types/tournament';
import { INITIAL_TOURNAMENT_STATE, detectSessionFromTime, sortMatchesChronologically } from '../utils/tournamentEngine';

const STORAGE_KEY = 'tournament_state_v1';
const API_URL = '/api/tournament';
const TOURNAMENT_DOC_PATH = 'tournaments/main';

function normalizeTournamentState(state: TournamentState): TournamentState {
  if (!state || !state.matches) return state;
  const updatedMatches = sortMatchesChronologically(
    state.matches.map((m) => {
      if (m.time) {
        const correctSession = detectSessionFromTime(m.time);
        if (m.session === 'sang' && correctSession !== 'sang') {
          return { ...m, session: correctSession };
        }
      }
      return m;
    })
  );
  return { ...state, matches: updatedMatches };
}

export const tournamentService = {
  /**
   * Tải dữ liệu giải đấu từ Firebase Firestore Cloud (Lưu trữ vĩnh viễn),
   * với fallback qua Backend API và LocalStorage
   */
  async getState(): Promise<TournamentState> {
    // 1. Ưu tiên đọc từ Cloud Firestore (vĩnh viễn, không bao giờ mất)
    try {
      const docRef = doc(db, 'tournaments', 'main');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const cloudData = docSnap.data() as TournamentState;
        // Cập nhật bản sao lưu LocalStorage
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudData));
        } catch {
          // ignore
        }
        return normalizeTournamentState(cloudData);
      } else {
        // Tài liệu trên cloud chưa tồn tại, tải từ local hoặc backend rồi đẩy lên cloud lưu vĩnh viễn
        let initialToSeed = INITIAL_TOURNAMENT_STATE;
        try {
          const local = localStorage.getItem(STORAGE_KEY);
          if (local) {
            initialToSeed = JSON.parse(local);
          } else {
            const res = await fetch(API_URL);
            if (res.ok) {
              const backendData = await res.json();
              if (backendData && backendData.players) {
                initialToSeed = backendData;
              }
            }
          }
        } catch {
          // fallback
        }

        // Đẩy lên Firestore để lưu vĩnh viễn
        try {
          await setDoc(docRef, initialToSeed);
        } catch (seedErr) {
          console.warn('Chưa thể khởi tạo tài liệu cloud ban đầu:', seedErr);
        }

        return initialToSeed;
      }
    } catch (firestoreError) {
      console.warn('Lỗi kết nối Firestore, đang sử dụng bộ nhớ đệm:', firestoreError);
    }

    // 2. Fallback backend và LocalStorage nếu mạng tạm thời gián đoạn
    try {
      const response = await fetch(API_URL, {
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.players) {
          return normalizeTournamentState(data);
        }
      }
    } catch {
      // Backend tạm thời không phản hồi
    }

    try {
      const local = localStorage.getItem(STORAGE_KEY);
      if (local) {
        return normalizeTournamentState(JSON.parse(local));
      }
    } catch {
      // fallback
    }

    return INITIAL_TOURNAMENT_STATE;
  },

  /**
   * Đăng ký lắng nghe trực tiếp thời gian thực từ Cloud Firestore
   * Khi Admin cập nhật tỉ số, tất cả máy Viewer nhận được dữ liệu ngay lập tức
   */
  subscribeToCloud(onUpdate: (state: TournamentState) => void): () => void {
    try {
      const docRef = doc(db, 'tournaments', 'main');
      const unsubscribe = onSnapshot(
        docRef,
        (snap) => {
          if (snap.exists()) {
            const rawData = snap.data() as TournamentState;
            const data = normalizeTournamentState(rawData);
            onUpdate(data);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            } catch {
              // ignore
            }
          }
        },
        (error) => {
          console.warn('Lỗi lắng nghe Firestore Snapshot:', error);
          handleFirestoreError(error, OperationType.GET, TOURNAMENT_DOC_PATH);
        }
      );
      return unsubscribe;
    } catch (err) {
      console.warn('Không thể thiết lập Cloud Snapshot listener:', err);
      return () => {};
    }
  },

  /**
   * Lưu toàn bộ trạng thái giải đấu lên Firebase Firestore Cloud (LƯU VĨNH VIỄN)
   * và đồng thời sao lưu backend + LocalStorage
   */
  async saveState(state: TournamentState): Promise<{ success: boolean; state: TournamentState }> {
    const updatedState: TournamentState = {
      ...state,
      matches: sortMatchesChronologically(state.matches || []),
      lastUpdated: new Date().toISOString(),
    };

    // Luôn lưu vào LocalStorage tức thì để phản hồi UI siêu nhanh
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedState));
    } catch (err) {
      console.warn('Lỗi lưu LocalStorage:', err);
    }

    // 1. Lưu vĩnh viễn lên Firebase Firestore Cloud
    try {
      const docRef = doc(db, 'tournaments', 'main');
      await setDoc(docRef, updatedState);
    } catch (firestoreErr) {
      console.error('Lỗi lưu lên Cloud Firestore:', firestoreErr);
      handleFirestoreError(firestoreErr, OperationType.WRITE, TOURNAMENT_DOC_PATH);
    }

    // 2. Đồng bộ thêm với Backend Server
    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedState),
      });
    } catch {
      // ignore server dev endpoint lag
    }

    return { success: true, state: updatedState };
  },

  /**
   * Khôi phục cài đặt gốc của giải đấu (trên cả Cloud và Local)
   */
  async resetToDefault(): Promise<TournamentState> {
    const defaultState: TournamentState = {
      ...INITIAL_TOURNAMENT_STATE,
      adminPin: '24072013',
      lastUpdated: new Date().toISOString(),
    };

    // Đặt lại trên Firestore Cloud
    try {
      const docRef = doc(db, 'tournaments', 'main');
      await setDoc(docRef, defaultState);
    } catch (err) {
      console.warn('Lỗi reset Firestore:', err);
    }

    try {
      await fetch(`${API_URL}/reset`, { method: 'POST' });
    } catch {
      // ignore
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState));
    } catch {
      // ignore
    }

    return defaultState;
  },
};
