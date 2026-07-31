/**
 * Calculates a basic PageRank for a given link graph.
 * 
 * @param linkGraph A map where the key is a URL and the value is an array of outbound link URLs.
 * @param dampingFactor The probability of continuing the random walk (default 0.85).
 * @param iterations The number of iterations to run (default 20).
 * @returns A Map of URLs to their computed PageRank scores.
 */
export function calculatePageRank(
  linkGraph: Map<string, string[]>,
  dampingFactor = 0.85,
  iterations = 20
): Map<string, number> {
  const nodes = Array.from(linkGraph.keys());
  const numNodes = nodes.length;
  
  if (numNodes === 0) return new Map();

  let ranks = new Map<string, number>();
  const initialRank = 1 / numNodes;

  // Initialize all nodes with an equal rank
  for (const node of nodes) {
    ranks.set(node, initialRank);
  }

  for (let i = 0; i < iterations; i++) {
    const newRanks = new Map<string, number>();
    
    // Distribute rank from each node
    for (const node of nodes) {
      newRanks.set(node, 0);
    }

    for (const [node, outbound] of linkGraph.entries()) {
      const currentRank = ranks.get(node) || 0;
      
      // Filter out links that aren't in our nodes list (e.g., external links)
      const validOutbound = outbound.filter(outNode => linkGraph.has(outNode));
      
      if (validOutbound.length > 0) {
        const sharedRank = currentRank / validOutbound.length;
        for (const outNode of validOutbound) {
          const prev = newRanks.get(outNode) || 0;
          newRanks.set(outNode, prev + sharedRank);
        }
      } else {
        // Dangling node: distribute its rank evenly to everyone
        const sharedRank = currentRank / numNodes;
        for (const n of nodes) {
          const prev = newRanks.get(n) || 0;
          newRanks.set(n, prev + sharedRank);
        }
      }
    }

    // Apply damping factor
    for (const node of nodes) {
      const rankFromLinks = newRanks.get(node) || 0;
      const finalRank = ((1 - dampingFactor) / numNodes) + (dampingFactor * rankFromLinks);
      ranks.set(node, finalRank);
    }
  }

  return ranks;
}
