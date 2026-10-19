export interface IPositionDuty {
  id: string;
  title: string;
  assigned: boolean;
}

export interface IPositionRole {
  id: string;
  title: string;
  responsible?: string;
  duties: IPositionDuty[];
}
