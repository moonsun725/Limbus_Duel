export interface Iskill 
{
    color: string;
    skillLv: number;
}
export interface Slot
{
    skillInfo: Iskill;
    userSelect: number;
    enhanceCond?: boolean; 

}