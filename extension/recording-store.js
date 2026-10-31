// Durable local copy of recordings in IndexedDB. Loaded by both the offscreen
// document (writes chunks while recording) and the service worker (checks for
// recordings that still need uploading).
//
// A recording is deleted only after the backend has accepted its upload, so a
// crash, a failed upload or a browser restart never loses the audio.
const RecordingStore = (() => {
  const DB_NAME = "minutes-recordings";
  const SESSIONS = "sessions"; // key: meetingId
  const CHUNKS = "chunks"; // key: [meetingId, seq]
  let dbPromise = null;

  function openDb() {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          db.createObjectStore(SESSIONS, { keyPath: "meetingId" });
          db.createObjectStore(CHUNKS, { keyPath: ["meetingId", "seq"] });
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => {
          dbPromise = null;
          reject(req.error);
        };
      });
    }
    return dbPromise;
  }

  function txDone(tx) {
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  function reqResult(req) {
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function chunkRange(meetingId) {
    return IDBKeyRange.bound([meetingId, 0], [meetingId, Number.MAX_SAFE_INTEGER]);
  }

  async function startSession(meetingId, startTime) {
    const db = await openDb();
    const tx = db.transaction(SESSIONS, "readwrite");
    tx.objectStore(SESSIONS).put({
      meetingId,
      startTime,
      lastChunkAt: startTime,
      status: "recording",
      attempts: 0,
    });
    return txDone(tx);
  }

  async function appendChunk(meetingId, seq, blob) {
    const db = await openDb();
    const tx = db.transaction([SESSIONS, CHUNKS], "readwrite");
    tx.objectStore(CHUNKS).put({ meetingId, seq, blob });
    const sessions = tx.objectStore(SESSIONS);
    const getReq = sessions.get(meetingId);
    getReq.onsuccess = () => {
      if (getReq.result) sessions.put({ ...getReq.result, lastChunkAt: Date.now() });
    };
    return txDone(tx);
  }

  async function updateSession(meetingId, patch) {
    const db = await openDb();
    const tx = db.transaction(SESSIONS, "readwrite");
    const sessions = tx.objectStore(SESSIONS);
    const getReq = sessions.get(meetingId);
    getReq.onsuccess = () => {
      if (getReq.result) sessions.put({ ...getReq.result, ...patch });
    };
    return txDone(tx);
  }

  async function listSessions() {
    const db = await openDb();
    return reqResult(db.transaction(SESSIONS).objectStore(SESSIONS).getAll());
  }

  // Concatenated chunks form a valid webm stream; returns null if none exist.
  async function buildBlob(meetingId) {
    const db = await openDb();
    const chunks = await reqResult(
      db.transaction(CHUNKS).objectStore(CHUNKS).getAll(chunkRange(meetingId))
    );
    if (!chunks.length) return null;
    return new Blob(chunks.map((c) => c.blob), { type: "audio/webm" });
  }

  async function remove(meetingId) {
    const db = await openDb();
    const tx = db.transaction([SESSIONS, CHUNKS], "readwrite");
    tx.objectStore(SESSIONS).delete(meetingId);
    tx.objectStore(CHUNKS).delete(chunkRange(meetingId));
    return txDone(tx);
  }

  return { startSession, appendChunk, updateSession, listSessions, buildBlob, remove };
})();
