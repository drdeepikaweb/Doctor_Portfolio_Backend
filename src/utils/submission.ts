function incrementPrefix(prefix: string): { newPrefix: string; wrapped: boolean } {
  const chars = prefix.split("");
  let wrapped = false;
  for (let i = chars.length - 1; i >= 0; i--) {
    if (chars[i] === "Z") {
      chars[i] = "A";
      if (i === 0) {
        wrapped = true;
      }
    } else {
      chars[i] = String.fromCharCode(chars[i].charCodeAt(0) + 1);
      break;
    }
  }
  return { newPrefix: chars.join(""), wrapped };
}

export function getNextSubmissionId(lastId?: string | null): string {
  let prefix = "AA";
  let seq = 0;

  if (lastId && lastId.length === 10) {
    const lastPrefix = lastId.slice(0, 2);
    const lastSeq = parseInt(lastId.slice(4, 6), 10);
    if (/^[A-Z]{2}$/.test(lastPrefix) && !isNaN(lastSeq)) {
      const incrementResult = incrementPrefix(lastPrefix);
      prefix = incrementResult.newPrefix;
      if (incrementResult.wrapped) {
        seq = (lastSeq + 1) % 100;
      } else {
        seq = lastSeq;
      }
    }
  }

  const now = new Date();
  const dateStr = String(now.getDate()).padStart(2, "0");
  const seqStr = String(seq).padStart(2, "0");
  const yearStr = String(now.getFullYear()).slice(-2);
  const monthStr = String(now.getMonth() + 1).padStart(2, "0");

  return `${prefix}${dateStr}${seqStr}${yearStr}${monthStr}`;
}

