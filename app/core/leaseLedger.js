const crypto = require('crypto');

function canonicalStringify(obj) {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalStringify).join(',') + ']';
  }
  const keys = Object.getOwnPropertyNames(obj)
    .filter(k => k !== '__proto__' && k !== 'constructor' && k !== 'prototype')
    .sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalStringify(obj[k])).join(',') + '}';
}

function hashLeaf(leafData) {
  const content = typeof leafData === 'string' ? leafData : canonicalStringify(leafData);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function hashNodes(leftHash, rightHash) {
  const [first, second] = leftHash < rightHash ? [leftHash, rightHash] : [rightHash, leftHash];
  return crypto.createHash('sha256').update(first + second).digest('hex');
}

class LeaseLedger {
  constructor(entries = []) {
    this.rawEntries = entries;
    this.leafHashes = entries.map(hashLeaf);
    this.layers = [];
    this.build();
  }

  build() {
    if (this.leafHashes.length === 0) {
      this.root = crypto.createHash('sha256').update('EMPTY_LEASE_LEDGER').digest('hex');
      this.layers = [[]];
      return;
    }

    let currentLayer = [...this.leafHashes];
    this.layers = [currentLayer];

    while (currentLayer.length > 1) {
      const nextLayer = [];
      for (let i = 0; i < currentLayer.length; i += 2) {
        if (i + 1 < currentLayer.length) {
          nextLayer.push(hashNodes(currentLayer[i], currentLayer[i + 1]));
        } else {
          nextLayer.push(hashNodes(currentLayer[i], currentLayer[i]));
        }
      }
      this.layers.push(nextLayer);
      currentLayer = nextLayer;
    }

    this.root = this.layers[this.layers.length - 1][0];
  }

  getRoot() {
    return this.root;
  }

  getProof(index) {
    if (index < 0 || index >= this.leafHashes.length) {
      throw new Error(`Invalid leaf index: ${index}`);
    }
    const proof = [];
    let currentIndex = index;

    for (let layerIndex = 0; layerIndex < this.layers.length - 1; layerIndex++) {
      const layer = this.layers[layerIndex];
      const isRight = currentIndex % 2 === 1;
      const siblingIndex = isRight ? currentIndex - 1 : currentIndex + 1;

      if (siblingIndex < layer.length) {
        proof.push({
          position: isRight ? 'left' : 'right',
          hash: layer[siblingIndex]
        });
      } else {
        proof.push({
          position: 'self',
          hash: layer[currentIndex]
        });
      }
      currentIndex = Math.floor(currentIndex / 2);
    }
    return proof;
  }

  static verifyProof(leafHash, proof, expectedRoot) {
    let currentHash = leafHash;
    for (const step of proof) {
      if (step.position === 'self') {
        currentHash = hashNodes(currentHash, currentHash);
      } else if (step.position === 'left') {
        currentHash = hashNodes(step.hash, currentHash);
      } else {
        currentHash = hashNodes(currentHash, step.hash);
      }
    }
    return currentHash === expectedRoot;
  }
}

module.exports = {
  LeaseLedger,
  hashLeaf,
  hashNodes,
  canonicalStringify
};
