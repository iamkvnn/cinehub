export interface GoogleProfileDto {
  family_name: string; 
  picture: string; 
  given_name: string; 
  email: string; 
  name: string;
}

export interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  refresh_token?: string;
}