// export class HeadlessWalletSDK {
//     private apiKey: string;
//     private baseUrl: string;
  
//     constructor(apiKey: string, baseUrl = "https://api.agateh.com") {
//       console.log("API key",apiKey);
      
//         if (apiKey !== '1234') {
//             throw new Error("Invalid Apikey")
//         } else {
//             this.apiKey = apiKey;
//             this.baseUrl = baseUrl;
//         }
//     }
  
//     async createWallet() {
//       return this.request("/wallet/create");
//     }
  
//     async signTransaction(transaction: any) {
//       return this.request("/wallet/sign", { transaction });
//     }
  
//     private async request(endpoint: string, body: any = {}) {
//       const response = await fetch(`${this.baseUrl}${endpoint}`, {
//         method: "POST",
//         headers: {
//           "Authorization": `Bearer ${this.apiKey}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(body),
//       });
  
//       if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
//       return response.json();
//     }
//   }

  // Export all functions and classes
export * from './connection/index.js';
export * from './wallet/keypair.js';
export * from './wallet/manager.js';
export * from './transaction/index.js';
export * from './types/index.js';