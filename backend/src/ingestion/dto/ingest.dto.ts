import { IsString, IsNotEmpty, IsArray } from 'class-validator';

export class IngestDto {
  @IsString()
  @IsNotEmpty()
  trackedUrlId: string;

  @IsArray()
  data: any[];

  @IsString()
  @IsNotEmpty()
  scrapeRunId: string;
}

