declare namespace google {
  namespace accounts {
    namespace oauth2 {
      interface TokenClientConfig {
        client_id: string;
        scope: string;
        prompt?: string;
        callback: (tokenResponse: TokenResponse) => void;
      }

      interface TokenResponse {
        access_token: string;
        expires_in: number;
        token_type: string;
        error?: string;
      }

      interface TokenClient {
        requestAccessToken: (options?: { prompt?: string }) => void;
      }

      function initTokenClient(config: TokenClientConfig): TokenClient;
      function revoke(accessToken: string, callback?: () => void): void;
    }

    namespace id {
      interface IdConfiguration {
        client_id: string;
        callback: (credentialResponse: CredentialResponse) => void;
        auto_prompt?: boolean;
      }

      interface CredentialResponse {
        credential: string;
        select_by: string;
      }

      function initialize(config: IdConfiguration): void;
      function prompt(): void;
    }
  }
}
