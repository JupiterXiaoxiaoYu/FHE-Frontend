import { UserRegistryABI } from '../abis/UserRegistryContract';
import { AccessControlABI } from '../abis/AccessControl';
import { BankRegistryABI } from '../abis/BankRegistryContract';
import { DataStorageABI } from '../abis/DataStorageContract';
import { TaskManagementABI } from '../abis/TaskManagementContract';


export const contractAddresses = {
  AccessControl: '0x412d17a4b6a79953bc891106b420bcd4493cd1cd',
  BankRegistry: '0xc92ad282ba7868b032341a3921b3635b0c45de74',
  DataStorage: '0x8a5f6e85dd884eede6f9de1bbfc1d9d5951f00fe',
  TaskManagement: '0x7a9b6d564d5d191093a29b7c760dd6af931cae73',
  UserRegistry: '0xad30bea381e7c6fa7277b98280f42c0f1d5bcc28'
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