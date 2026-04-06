const mockSocket = {
  connected: false,
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn(),
}

module.exports = {
  io: jest.fn(() => mockSocket),
  mockSocket, // exported for test access
}
