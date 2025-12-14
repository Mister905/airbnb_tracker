import { IsString, IsUrl, IsBoolean, IsOptional } from 'class-validator';

export class CreateTrackedUrlDto {
  @IsUrl()
  url: string;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}

export class UpdateTrackedUrlDto {
  @IsUrl()
  @IsOptional()
  url?: string;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}
