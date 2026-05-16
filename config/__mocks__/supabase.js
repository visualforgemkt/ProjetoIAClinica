const mockChain = {
  select: jest.fn(() => mockChain),
  insert: jest.fn(() => mockChain),
  update: jest.fn(() => mockChain),
  delete: jest.fn(() => mockChain),
  eq: jest.fn(() => mockChain),
  single: jest.fn().mockResolvedValue({ data: null, error: null })
};

module.exports = {
  from: jest.fn(() => mockChain),
  ...mockChain
};
