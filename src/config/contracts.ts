import { UserRegistryABI } from '../abis/UserRegistryContract';
import { AccessControlABI } from '../abis/AccessControl';
import { BankRegistryABI } from '../abis/BankRegistryContract';
import { DataStorageABI } from '../abis/DataStorageContract';
import { TaskManagementABI } from '../abis/TaskManagementContract';


export const contractAddresses = {
  AccessControl: '0x4c02c975a36137d3d4b68484aadbce89414d73a0',
  BankRegistry: '0x22ac23bf2d2cf1b4d8fec9cb4d279c7da6718e35',
  DataStorage: '0x9b6da04f586857caed17d7c2a22e81ec572a3e6c',
  TaskManagement: '0x2c17c0e8f8615dba78d868d97965f9dcdc3c5d9b',
  UserRegistry: '0xf7dc9895b11cf4400334d659df5ac8ea4033b450'
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