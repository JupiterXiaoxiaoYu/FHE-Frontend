import { UserRegistryABI } from '../abis/UserRegistryContract';
import { AccessControlABI } from '../abis/AccessControl';
import { BankRegistryABI } from '../abis/BankRegistryContract';
import { DataStorageABI } from '../abis/DataStorageContract';
import { TaskManagementABI } from '../abis/TaskManagementContract';


export const contractAddresses = {
  AccessControl: '0x412d17a4b6a79953bc891106b420bcd4493cd1cd',
  BankRegistry: '0x2022052c63ac06768984abce6a3a2f889e9542db',
  DataStorage: '0x2f4de204ede2876817dadc543f264c6b237b0110',
  TaskManagement: '0x7a9b6d564d5d191093a29b7c760dd6af931cae73',
  UserRegistry: '0x7b4a4ec3ed0706a7f623ccb004c9660b06b8607b'
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