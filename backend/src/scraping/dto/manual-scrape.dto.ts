import { IsString, IsNotEmpty } from 'class-validator';

export class ManualScrapeDto {
  @IsString()
  @IsNotEmpty()
  trackedUrlId: string;
}

