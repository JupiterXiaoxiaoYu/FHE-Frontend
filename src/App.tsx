import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { ClientPortal } from './pages/ClientPortal';
import { BankPortal } from './pages/BankPortal';
// import { Test } from './pages/Test';
import { Web3Provider  } from './Web3Provider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'


const queryClient = new QueryClient()
function App() {
  return (
    // <Web3Provider>
    //   <QueryClientProvider client={queryClient}>
      <ConfigProvider
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: {
            colorPrimary: '#1890ff',
          },
        }}
      >
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="client" element={<ClientPortal />} />
              <Route path="bank" element={<BankPortal />} />
              {/* <Route path="test" element={<Test />} /> */}
            </Route>
          </Routes>
          </BrowserRouter>
        </ConfigProvider>
    //   </QueryClientProvider>
    // </Web3Provider>
  );
}

export default App;