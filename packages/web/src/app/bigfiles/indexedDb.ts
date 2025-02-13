// @ts-nocheck
export const DB_NAME = "auditDB";
export const STORE_NAME = "index";
export const SECURITY_STORE = "securityIssues";

let storeCounter = 0;

export async function initDB() {
  return new Promise((resolve, reject) => {
    const deleteRequest = indexedDB.deleteDatabase(DB_NAME);

    deleteRequest.onsuccess = () => {
      const request = indexedDB.open(DB_NAME);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        db.createObjectStore(STORE_NAME, { keyPath: "index" });
        const securityStore = db.createObjectStore(SECURITY_STORE, {
          keyPath: "id",
          autoIncrement: true,
        });
        securityStore.createIndex("id_idx", "id");
      };
    };

    deleteRequest.onerror = () => reject(deleteRequest.error);
  });
}

export async function storeIndexData(db, indexData) {
  const transaction = db.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);

  for (const [index, value] of Object.entries(indexData)) {
    store.put({ index, value });
    storeCounter += 1;
  }

  return new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function displayStoredData(db) {
  const transaction = db.transaction(STORE_NAME, "readonly");
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve) => {
    const request = store.getAll();
    request.onsuccess = () => {
      console.log("Stored index data:", request.result);
      resolve(request.result);
    };
  });
}

export async function storeIssues(db, security) {
  const transaction = db.transaction(SECURITY_STORE, "readwrite");
  const store = transaction.objectStore(SECURITY_STORE);

  for (const [issueType, issueData] of Object.entries(security.issues)) {
    issueData.issues.forEach((issue) => {
      store.put({
        type: issueType,
        description: issueData.description,
        score: issue.score,
        criticality: issue.criticality,
        fingerprint: issue.fingerprint,
        pointer: issue.pointer,
      });
    });
  }

  return new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function displaySecurityIssues(db) {
  const transaction = db.transaction(SECURITY_STORE, "readonly");
  const store = transaction.objectStore(SECURITY_STORE);

  return new Promise((resolve) => {
    const request = store.getAll();
    request.onsuccess = () => {
      console.log("Security issues:", request.result);
      resolve(request.result);
    };
  });
}

export async function getSecurityIssuesChunk(db, from, to) {
  const transaction = db.transaction([SECURITY_STORE, STORE_NAME], "readonly");
  const securityStore = transaction.objectStore(SECURITY_STORE);
  const indexStore = transaction.objectStore(STORE_NAME);
  const index = securityStore.index("id_idx");
  const boundKeyRange = IDBKeyRange.bound(from + 1, to);

  return new Promise((resolve, reject) => {
    const request = index.getAll(boundKeyRange);

    request.onsuccess = async () => {
      const issues = request.result;

      // Replace pointers with actual paths
      const issuesWithPaths = await Promise.all(
        issues.map(async (issue) => {
          const pathRequest = indexStore.get(issue.pointer.toString());
          return new Promise((resolveIssue) => {
            pathRequest.onsuccess = () => {
              resolveIssue({
                ...issue,
                pointer: pathRequest.result.value,
              });
            };
          });
        })
      );

      resolve(issuesWithPaths);
    };

    request.onerror = () => reject(request.error);
  });
}

// export function fetchDataWithStream() {
//   const containerStart = document.getElementById("start-loading");
//   containerStart.innerHTML = `<b>Loading started at ${getDate()}</b>`;

//   console.log("Fetching data with stream");

//   fetch("/reports")
//     .then(async (response) => {
//       const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();

//       while (true) {
//         const { done, value } = await reader.read();
//         if (done) {
//           break;
//         }
//         parser.write(value);
//       }

//       parser.close();
//       reader.releaseLock();
//     })
//     .then(() => {
//       console.log("done!");
//     })
//     .catch(console.error);
// }

export function getDate() {
  const date = new Date();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  return `${date.getHours()}.${minutes < 10 ? "0" + minutes : minutes}.${
    seconds < 10 ? "0" + seconds : seconds
  }`;
}

// export async function fetchAuditData() {
//   const response = await fetch("/audit");
//   const data = await response.json();
//   console.log("Audit data:", data);
//   return data;
// }

function renderIssueCard(issue) {
  return `
    <div class="issue-card criticality-${issue.criticality}">
      <h3>${issue.type}</h3>
      <div class="issue-path">${issue.pointer}</div>
      <div class="issue-description">${issue.description}</div>
      <div class="issue-meta">
        <span>Score: ${issue.score}</span>
        <span>Criticality: ${issue.criticality}</span>
      </div>
    </div>
  `;
}

function displayIssueCards(chunk) {
  const container = document.getElementById("security-issues");
  container.innerHTML = chunk.map(renderIssueCard).join("");
}

export async function demo(data) {
  try {
    storeCounter = 0;
    const start = Date.now();

    const db = await initDB();
    //const data = await fetchAuditData();

    if (data.index) {
      await storeIndexData(db, data.index);
    }
    if (data.security) {
      await storeIndexData(db, data.security);
    }
    if (data.data) {
      await storeIndexData(db, data.data);
    }
    if (data.warnings) {
      await storeIndexData(db, data.warnings);
    }
    const chunk = await getSecurityIssuesChunk(db, 5, 15);

    const millis = Date.now() - start;
    console.log("DB time ms = " + millis + ", db saved entries = " + storeCounter);
    const container = document.getElementById("security-issues-debug");
    container.innerHTML = "DB time ms = " + millis + ", db saved entries = " + storeCounter;

    displayIssueCards(chunk);
  } catch (error) {
    console.error("Failed to initialize database:", error);
  }
}
