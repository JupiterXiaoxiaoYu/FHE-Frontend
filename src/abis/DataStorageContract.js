export const DataStorageABI = [{"inputs":[{"internalType":"address","name":"_accessControl","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"userAddress","type":"address"},{"indexed":true,"internalType":"address","name":"bankAddress","type":"address"},{"indexed":false,"internalType":"string","name":"dataType","type":"string"},{"indexed":true,"internalType":"uint256","name":"expiryDate","type":"uint256"}],"name":"DataStored","type":"event"},{"inputs":[],"name":"accessControl","outputs":[{"internalType":"contract AccessControl","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"dataEntries","outputs":[{"internalType":"address","name":"userAddress","type":"address"},{"internalType":"address","name":"bankAddress","type":"address"},{"internalType":"string","name":"dataType","type":"string"},{"internalType":"uint256","name":"expiryDate","type":"uint256"},{"internalType":"string","name":"encryptedData","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"userAddress","type":"address"},{"internalType":"string","name":"dataType","type":"string"}],"name":"getDataByUserAndType","outputs":[{"components":[{"internalType":"address","name":"userAddress","type":"address"},{"internalType":"address","name":"bankAddress","type":"address"},{"internalType":"string","name":"dataType","type":"string"},{"internalType":"uint256","name":"expiryDate","type":"uint256"},{"internalType":"string","name":"encryptedData","type":"string"}],"internalType":"struct DataStorageContract.DataEntry[]","name":"","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"userAddress","type":"address"},{"internalType":"string","name":"dataType","type":"string"},{"internalType":"uint256","name":"expiryDate","type":"uint256"},{"internalType":"string","name":"encryptedData","type":"string"}],"name":"storeUserData","outputs":[],"stateMutability":"nonpayable","type":"function"}];