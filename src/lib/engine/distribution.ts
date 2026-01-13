export type DistributionMode = "AUTO" | "RANDOM_SUBSET" | "SAME_SET_SHUFFLED";

export function decideMode(
  mode: DistributionMode,
  poolSize: number,
  employeeCount: number,
  perCandidateCount: number,
): Exclude<DistributionMode, "AUTO"> {
  if (mode !== "AUTO") return mode;
  return poolSize >= employeeCount * perCandidateCount ? "RANDOM_SUBSET" : "SAME_SET_SHUFFLED";
}

// deterministic shuffle
function hashToSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function shuffle<T>(arr: T[], seedStr: string): T[] {
  const rng = mulberry32(hashToSeed(seedStr));
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildAssignmentQuestionSets(params: {
  mode: DistributionMode;
  seed: string; // testId + assignmentBatchId
  employeeIds: string[];
  poolQuestionIds: string[];
  perCandidateCount: number;
}): { modeUsed: "RANDOM_SUBSET" | "SAME_SET_SHUFFLED"; byEmployee: Record<string, string[]> } {
  const { employeeIds, poolQuestionIds, perCandidateCount } = params;

  if (poolQuestionIds.length < perCandidateCount) {
    throw new Error("Pool too small for perCandidateCount");
  }

  const modeUsed = decideMode(params.mode, poolQuestionIds.length, employeeIds.length, perCandidateCount);

  const byEmployee: Record<string, string[]> = {};

  if (modeUsed === "SAME_SET_SHUFFLED") {
    // choose one deterministic base set
    const base = shuffle(poolQuestionIds, `BASE:${params.seed}`).slice(0, perCandidateCount);
    for (const e of employeeIds) byEmployee[e] = base;
    return { modeUsed, byEmployee };
  }

  const disjointPossible = poolQuestionIds.length >= employeeIds.length * perCandidateCount;
  const poolShuffled = shuffle(poolQuestionIds, `POOL:${params.seed}`);

  employeeIds.forEach((e, idx) => {
    if (disjointPossible) {
      const start = idx * perCandidateCount;
      byEmployee[e] = poolShuffled.slice(start, start + perCandidateCount);
    } else {
      byEmployee[e] = shuffle(poolQuestionIds, `SUB:${params.seed}:${e}`).slice(0, perCandidateCount);
    }
  });

  return { modeUsed, byEmployee };
}
