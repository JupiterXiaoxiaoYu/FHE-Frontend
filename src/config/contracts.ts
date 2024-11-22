import { UserRegistryABI } from '../abis/UserRegistryContract';
import { AccessControlABI } from '../abis/AccessControl';
import { BankRegistryABI } from '../abis/BankRegistryContract';
import { DataStorageABI } from '../abis/DataStorageContract';
import { TaskManagementABI } from '../abis/TaskManagementContract';


export const contractAddresses = {
  AccessControl: '0x4c02c975a36137d3d4b68484aadbce89414d73a0',
  BankRegistry: '0x22ac23bf2d2cf1b4d8fec9cb4d279c7da6718e35',
  DataStorage: '0x214ff3ba4c024ad53c404849b815de1e45b98cd8',
  TaskManagement: '0x3a720a9ecb1d5c09629186fd0c1b694f16f2bce9',
  UserRegistry: '0x1a5361d7b48e5e422673e5ec281d3abc0d6f7efe'
};

export const contractConfig = {
  AccessControl: {
    address: contractAddresses.AccessControl,
    abi: AccessControlABI
  },
  BankRegistry: {
    address: contractAddresses.BankRegistry,
    abi: BankRegistryABI
  },
  DataStorage: {
    address: contractAddresses.DataStorage,
    abi: DataStorageABI
  },
  TaskManagement: {
    address: contractAddresses.TaskManagement,
    abi: TaskManagementABI
  },
  UserRegistry: {
    address: contractAddresses.UserRegistry,
    abi: UserRegistryABI
  }
};

export default contractConfig; 