
import { Metadata } from "@grpc/grpc-js";
import { Observable } from "rxjs";

export interface CreateCharacterProfileRequest {
  userId: string;
  userName: string;
}

export interface CreateCharacterProfileResponse {
  characterId: string;
  characterName: string;
  characterTitle: string;
  level: number;
  exp: number;
  nextLevelExp: number;
}

export interface GetCharacterProfileRequest {
  userId: string;
}

export interface GetCharacterProfileResponse {
  character: Character | undefined;
}

export interface GetCharacterProfileByBulkRequest {
  userIds: string[];
}

export interface GetCharacterProfileByBulkResponse {
  characters: Character[];
}

export interface Character {
  id: string;
  characterName: string;
  characterTitle: string;
  level: number;
  exp: number;
  nextLevelExp: number;
}

export interface CharacterServiceClient {
  createCharacterProfile(request: CreateCharacterProfileRequest, metaData: Metadata): Observable<CreateCharacterProfileResponse>;

  getCharacterProfile(request: GetCharacterProfileRequest, metaData: Metadata): Observable<GetCharacterProfileResponse>;

  getCharacterProfileByBulk(request: GetCharacterProfileByBulkRequest, metaData: Metadata): Observable<GetCharacterProfileByBulkResponse>;
}
