// import { 
//     EnterpriseAuth, 
//     AuthMethod, 
//     OAuthProvider,
//     AuthState
//   } from '@hermis/solana-headless-enterprise-core';
//   import { createLocalStorageUtility } from '@hermis/solana-headless-adapter-base';
  
//   // DOM Elements
//   let statusElement: HTMLElement;
//   let userInfoElement: HTMLElement;
//   let errorElement: HTMLElement;
//   let authButtonsContainer: HTMLElement;
//   let tokenInfoContainer: HTMLElement;
//   let debugInfoElement: HTMLElement;
  
//   // Create a custom storage utility using the existing adapter
//   const authStorageUtil = createLocalStorageUtility<AuthState | null>('hermis_enterprise_auth', null);
  
//   // Initialize EnterpriseAuth
//   const auth = new EnterpriseAuth({
//     apiUrl: 'http://localhost:4600', // Update with your actual backend URL
//     storageKey: 'hermis_enterprise_auth'
//   });
  
//   // Initialize the application
//   function initApp() {
//     // Get DOM elements
//     statusElement = document.getElementById('auth-status')!;
//     userInfoElement = document.getElementById('user-info')!;
//     errorElement = document.getElementById('error-info')!;
//     authButtonsContainer = document.getElementById('auth-buttons')!;
//     tokenInfoContainer = document.getElementById('token-info')!;
//     debugInfoElement = document.getElementById('debug-info')!;
    
//     // Set up event listeners for auth buttons
//     setupAuthButtons();
    
//     // Handle OAuth redirect if applicable
//     handleOAuthRedirect();
    
//     // Subscribe to auth state changes
//     subscribeToAuthChanges();
//   }
  
//   // Set up event listeners for auth buttons
//   function setupAuthButtons() {
//     // Google sign in
//     document.getElementById('google-signin')?.addEventListener('click', () => {
//       auth.signInWithOAuth(OAuthProvider.GOOGLE);
//     });
    
//     // GitHub sign in
//     document.getElementById('github-signin')?.addEventListener('click', () => {
//       auth.signInWithOAuth(OAuthProvider.GITHUB);
//     });
    
//     // Twitter sign in
//     document.getElementById('twitter-signin')?.addEventListener('click', () => {
//       auth.signInWithOAuth(OAuthProvider.TWITTER);
//     });
    
//     // Discord sign in
//     document.getElementById('discord-signin')?.addEventListener('click', () => {
//       auth.signInWithOAuth(OAuthProvider.DISCORD);
//     });
    
//     // Facebook sign in
//     document.getElementById('facebook-signin')?.addEventListener('click', () => {
//       auth.signInWithOAuth(OAuthProvider.FACEBOOK);
//     });
    
//     // Reddit sign in
//     document.getElementById('reddit-signin')?.addEventListener('click', () => {
//       auth.signInWithOAuth(OAuthProvider.REDDIT);
//     });
    
//     // Sign out
//     document.getElementById('signout-button')?.addEventListener('click', () => {
//       auth.signOut();
//     });
//   }
  
//   // Handle OAuth redirect
//   async function handleOAuthRedirect() {
//     const urlParams = new URLSearchParams(window.location.search);
//     const hasAuthParams = urlParams.has('jwt') || urlParams.has('error') || urlParams.has('state');
    
//     if (hasAuthParams) {
//       // Show loading indicator
//       document.getElementById('loading-indicator')!.style.display = 'block';
      
//       try {
//         const result = await auth.handleOAuthRedirect();
        
//         if (result.error) {
//           console.error('OAuth redirect handling failed:', result.error);
//         }
//       } finally {
//         // Hide loading indicator
//         document.getElementById('loading-indicator')!.style.display = 'none';
//       }
//     }
//   }
  
//   // Subscribe to auth state changes
//   function subscribeToAuthChanges() {
//     auth.onAuthStateChange(state => {
//       updateUI(state);
      
//       // Also update our custom storage for debugging
//       authStorageUtil.set(state);
//     });
//   }
  
//   // Update UI based on auth state
//   function updateUI(state: AuthState) {
//     // Update authentication status
//     if (state.isAuthenticated) {
//       statusElement.innerHTML = `<p>✅ <strong>Authenticated</strong> (via ${state.method})</p>`;
      
//       if (state.user) {
//         const userName = state.user.name || state.user.email || 'User';
//         userInfoElement.innerHTML = `<p>Welcome, ${userName}!</p>
//           <p>Wallet Public Key: ${state.publicKey}</p>`;
//       }
      
//       // Show sign out button
//       document.getElementById('signout-container')!.style.display = 'block';
      
//       // Hide auth buttons
//       authButtonsContainer.style.display = 'none';
      
//       // Show token info
//       tokenInfoContainer.style.display = 'block';
//       if (state.jwt) {
//         const truncatedJwt = `${state.jwt.substring(0, 20)}...${state.jwt.substring(state.jwt.length - 20)}`;
//         const userInfoJson = JSON.stringify(state.user, null, 2);
        
//         document.getElementById('jwt-display')!.textContent = truncatedJwt;
//         document.getElementById('user-json')!.textContent = userInfoJson;
//       }
//     } else {
//       statusElement.innerHTML = '<p>❌ <strong>Not Authenticated</strong></p>';
//       userInfoElement.innerHTML = '';
      
//       // Hide sign out button
//       document.getElementById('signout-container')!.style.display = 'none';
      
//       // Show auth buttons
//       authButtonsContainer.style.display = 'block';
      
//       // Hide token info
//       tokenInfoContainer.style.display = 'none';
      
//       // Show error if present
//       if (state.error) {
//         errorElement.innerHTML = `<p>Error: ${state.error}</p>`;
//         errorElement.style.display = 'block';
//       } else {
//         errorElement.style.display = 'none';
//       }
//     }
    
//     // Update debug info
//     debugInfoElement.textContent = JSON.stringify(state, null, 2);
//   }
  
//   // Initialize the app when DOM is loaded
//   document.addEventListener('DOMContentLoaded', initApp);