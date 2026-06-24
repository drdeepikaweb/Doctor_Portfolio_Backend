function incrementPrefix(prefix: string): string {
  const chars = prefix.split("");
  for (let i = chars.length - 1; i >= 0; i--) {
    if (chars[i] === "Z") {
      chars[i] = "A";
    } else {
      chars[i] = String.fromCharCode(chars[i].charCodeAt(0) + 1);
      break;
    }
  }
  return chars.join("");
}

function incrementSeq(seq: number): number {
  return (seq + 1) % 1000;
}

export function getNextSubmissionId(lastId?: string | null): string {
  let prefix = "AAA";
  let seq = 0;

  if (lastId && lastId.length === 12) {
    const lastPrefix = lastId.slice(0, 3);
    const lastSeq = parseInt(lastId.slice(5, 8), 10);
    if (/^[A-Z]{3}$/.test(lastPrefix) && !isNaN(lastSeq)) {
      prefix = incrementPrefix(lastPrefix);
      seq = incrementSeq(lastSeq);
    }
  }

  const now = new Date();
  const dateStr = String(now.getDate()).padStart(2, "0");
  const seqStr = String(seq).padStart(3, "0");
  const yearStr = String(now.getFullYear()).slice(-2);
  const monthStr = String(now.getMonth() + 1).padStart(2, "0");

  return `${prefix}${dateStr}${seqStr}${yearStr}${monthStr}`;
}
