using System;
using System.Collections.Generic;
using LOR_DiceSystem;
using UnityEngine;

// Token: 0x0200056B RID: 1387
public class BattleUnitBuf
{
	// Token: 0x17000225 RID: 549
	// (get) Token: 0x0600248D RID: 9357 RVA: 0x000894B0 File Offset: 0x000876B0
	public virtual bool IsControllable
	{
		get
		{
			return true;
		}
	}

	// Token: 0x17000226 RID: 550
	// (get) Token: 0x0600248E RID: 9358 RVA: 0x00103400 File Offset: 0x00101600
	public virtual bool Hide
	{
		get
		{
			return this.hide;
		}
	}

	// Token: 0x17000227 RID: 551
	// (get) Token: 0x0600248F RID: 9359 RVA: 0x00103408 File Offset: 0x00101608
	public virtual int paramInBufDesc
	{
		get
		{
			return this.stack;
		}
	}

	// Token: 0x17000228 RID: 552
	// (get) Token: 0x06002490 RID: 9360 RVA: 0x00005931 File Offset: 0x00003B31
	public virtual KeywordBuf bufType
	{
		get
		{
			return KeywordBuf.None;
		}
	}

	// Token: 0x17000229 RID: 553
	// (get) Token: 0x06002491 RID: 9361 RVA: 0x00005931 File Offset: 0x00003B31
	public virtual bool independentBufIcon
	{
		get
		{
			return false;
		}
	}

	// Token: 0x1700022A RID: 554
	// (get) Token: 0x06002492 RID: 9362 RVA: 0x000F83F6 File Offset: 0x000F65F6
	protected virtual string keywordId
	{
		get
		{
			return "";
		}
	}

	// Token: 0x1700022B RID: 555
	// (get) Token: 0x06002493 RID: 9363 RVA: 0x00103410 File Offset: 0x00101610
	protected virtual string keywordIconId
	{
		get
		{
			return this.keywordId;
		}
	}

	// Token: 0x1700022C RID: 556
	// (get) Token: 0x06002494 RID: 9364 RVA: 0x00005931 File Offset: 0x00003B31
	public virtual BufPositiveType positiveType
	{
		get
		{
			return BufPositiveType.None;
		}
	}

	// Token: 0x1700022D RID: 557
	// (get) Token: 0x06002495 RID: 9365 RVA: 0x00005931 File Offset: 0x00003B31
	public virtual bool isAssimilation
	{
		get
		{
			return false;
		}
	}

	// Token: 0x1700022E RID: 558
	// (get) Token: 0x06002496 RID: 9366 RVA: 0x00103418 File Offset: 0x00101618
	public string bufActivatedName
	{
		get
		{
			return Singleton<BattleEffectTextsXmlList>.Instance.GetEffectTextName(this.keywordId);
		}
	}

	// Token: 0x1700022F RID: 559
	// (get) Token: 0x06002497 RID: 9367 RVA: 0x0010342C File Offset: 0x0010162C
	public string bufActivatedNameWithStack
	{
		get
		{
			if (this.stack > 0)
			{
				return Singleton<BattleEffectTextsXmlList>.Instance.GetEffectTextName(this.keywordId) + " " + this.stack;
			}
			return Singleton<BattleEffectTextsXmlList>.Instance.GetEffectTextName(this.keywordId);
		}
	}

	// Token: 0x17000230 RID: 560
	// (get) Token: 0x06002498 RID: 9368 RVA: 0x00103478 File Offset: 0x00101678
	public virtual string bufActivatedText
	{
		get
		{
			return Singleton<BattleEffectTextsXmlList>.Instance.GetEffectTextDesc(this.keywordId, this.paramInBufDesc);
		}
	}

	// Token: 0x17000231 RID: 561
	// (get) Token: 0x06002499 RID: 9369 RVA: 0x00103490 File Offset: 0x00101690
	public string bufKeywordText
	{
		get
		{
			return this.bufActivatedName + " " + this.stack;
		}
	}

	// Token: 0x0600249A RID: 9370 RVA: 0x001034AD File Offset: 0x001016AD
	public virtual void Init(BattleUnitModel owner)
	{
		this._owner = owner;
	}

	// Token: 0x0600249B RID: 9371 RVA: 0x000021A4 File Offset: 0x000003A4
	public virtual void OnAddBuf(int addedStack)
	{
	}

	// Token: 0x0600249C RID: 9372 RVA: 0x001034B6 File Offset: 0x001016B6
	public virtual void Destroy()
	{
		this.stack = 0;
		this._destroyed = true;
	}

	// Token: 0x0600249D RID: 9373 RVA: 0x001034C6 File Offset: 0x001016C6
	public bool IsDestroyed()
	{
		return this._destroyed;
	}

	// Token: 0x0600249E RID: 9374 RVA: 0x00005931 File Offset: 0x00003B31
	public virtual bool NullifyNotTargetable()
	{
		return false;
	}

	// Token: 0x0600249F RID: 9375 RVA: 0x000894B0 File Offset: 0x000876B0
	public virtual bool IsTargetable()
	{
		return true;
	}

	// Token: 0x060024A0 RID: 9376 RVA: 0x000894B0 File Offset: 0x000876B0
	public virtual bool IsTauntable()
	{
		return true;
	}

	// Token: 0x060024A1 RID: 9377 RVA: 0x000894B0 File Offset: 0x000876B0
	public virtual bool IsTargetable(BattleUnitModel attacker)
	{
		return true;
	}

	// Token: 0x060024A2 RID: 9378 RVA: 0x000894B0 File Offset: 0x000876B0
	public virtual bool IsCardChoosable(BattleDiceCardModel card)
	{
		return true;
	}

	// Token: 0x060024A3 RID: 9379 RVA: 0x000894B0 File Offset: 0x000876B0
	public virtual bool IsActionable()
	{
		return true;
	}

	// Token: 0x060024A4 RID: 9380 RVA: 0x000894AD File Offset: 0x000876AD
	public virtual List<BattleUnitModel> GetFixedTarget()
	{
		return null;
	}

	// Token: 0x060024A5 RID: 9381 RVA: 0x00005931 File Offset: 0x00003B31
	public virtual bool IsInvincibleHp(BattleUnitModel attacker)
	{
		return false;
	}

	// Token: 0x060024A6 RID: 9382 RVA: 0x00005931 File Offset: 0x00003B31
	public virtual bool IsInvincibleBp(BattleUnitModel attacker)
	{
		return false;
	}

	// Token: 0x060024A7 RID: 9383 RVA: 0x000021A4 File Offset: 0x000003A4
	public virtual void OnDie()
	{
	}

	// Token: 0x060024A8 RID: 9384 RVA: 0x000021A4 File Offset: 0x000003A4
	public virtual void OnDieForReadybuf()
	{
	}

	// Token: 0x060024A9 RID: 9385 RVA: 0x000021A4 File Offset: 0x000003A4
	public virtual void OnDieOtherUnit(BattleUnitModel unit)
	{
	}

	// Token: 0x060024AA RID: 9386 RVA: 0x000894AD File Offset: 0x000876AD
	public virtual StatBonus GetStatBonus()
	{
		return null;
	}

	// Token: 0x060024AB RID: 9387 RVA: 0x00005931 File Offset: 0x00003B31
	public virtual int MaxPlayPointAdder()
	{
		return 0;
	}

	// Token: 0x060024AC RID: 9388 RVA: 0x000021A4 File Offset: 0x000003A4
	public virtual void OnRoundStart()
	{
	}

	// Token: 0x060024AD RID: 9389 RVA: 0x000021A4 File Offset: 0x000003A4
	public virtual void OnRoundStartAfter()
	{
	}

	// Token: 0x060024AE RID: 9390 RVA: 0x000021A4 File Offset: 0x000003A4
	public virtual void OnDrawCard()
	{
	}

	// Token: 0x060024AF RID: 9391 RVA: 0x00005931 File Offset: 0x00003B31
	public virtual int SpeedDiceNumAdder()
	{
		return 0;
	}

	// Token: 0x060024B0 RID: 9392 RVA: 0x00005931 File Offset: 0x00003B31
	public virtual int SpeedDiceBreakedAdder()
	{
		return 0;
	}

	// Token: 0x060024B1 RID: 9393 RVA: 0x00005931 File Offset: 0x00003B31
	public virtual int GetSpeedDiceAdder(int speedDiceResult)
	{
		return 0;
	}

	// Token: 0x060024B2 RID: 9394 RVA: 0x00005931 File Offset: 0x00003B31
	public virtual int GetDamageReduction(BattleDiceBehavior behavior)
	{
		return 0;
	}

	// Token: 0x060024B3 RID: 9395 RVA: 0x00005931 File Offset: 0x00003B31
	public virtual int GetBreakDamageReduction(BehaviourDetail behaviourDetail)
	{
		return 0;
	}

	// Token: 0x060024B4 RID: 9396 RVA: 0x00005931 File Offset: 0x00003B31
	public virtual int GetDamageIncreaseRate()
	{
		return 0;
	}

	// Token: 0x060024B5 RID: 9397 RVA: 0x00005931 File Offset: 0x00003B31
	public virtual int GetEmotionCoinAdder(int defaultCount)
	{
		return 0;
	}

	// Token: 0x060024B6 RID: 9398 RVA: 0x00005931 File Offset: 0x00003B31
	public virtual int GetBreakDamageIncreaseRate()
	{
		return 0;
	}

	// Token: 0x060024B7 RID: 9399 RVA: 0x00005931 File Offset: 0x00003B31
	public virtual int GetDamageReductionRate()
	{
		return 0;
	}

	// Token: 0x060024B8 RID: 9400 RVA: 0x00005931 File Offset: 0x00003B31
	public virtual int GetBreakDamageReductionRate()
	{
		return 0;
	}

	// Token: 0x060024B9 RID: 9401 RVA: 0x00005931 File Offset: 0x00003B31
	public virtual int GetDamageReductionAll()
	{
		return 0;
	}

	// Token: 0x060024BA RID: 9402 RVA: 0x001034D0 File Offset: 0x001016D0
	public Sprite GetBufIcon()
	{
		if (!this._iconInit)
		{
			try
			{
				if (this.Hide)
				{
					this._bufIcon = null;
				}
				else
				{
					Dictionary<string, Sprite> bufIconDictionary = BattleUnitBuf._bufIconDictionary;
					if (bufIconDictionary != null && bufIconDictionary.Count == 0)
					{
						Sprite[] array = Resources.LoadAll<Sprite>("Sprites/BufIconSheet/");
						if (array != null && array.Length != 0)
						{
							for (int i = 0; i < array.Length; i++)
							{
								BattleUnitBuf._bufIconDictionary.Add(array[i].name, array[i]);
							}
						}
					}
					if (BattleUnitBuf._bufIconDictionary != null)
					{
						BattleUnitBuf._bufIconDictionary.TryGetValue(this.keywordIconId, out this._bufIcon);
					}
					if (this._bufIcon == null)
					{
						this._bufIcon = Resources.Load<Sprite>("Sprites/BufIcon/" + this.keywordIconId);
					}
				}
			}
			catch (Exception)
			{
				this._bufIcon = null;
			}
			this._iconInit = true;
		}
		return this._bufIcon;
	}

	// Token: 0x060024BB RID: 9403 RVA: 0x000021A4 File Offset: 0x000003A4
	public virtual void OnRollSpeedDice()
	{
	}

	// Token: 0x060024BC RID: 9404 RVA: 0x000021A4 File Offset: 0x000003A4
	public virtual void OnAfterRollSpeedDice()
	{
	}

	// Token: 0x060024BD RID: 9405 RVA: 0x000021A4 File Offset: 0x000003A4
	public virtual void OnRoundEnd()
	{
	}

	// Token: 0x060024BE RID: 9406 RVA: 0x000021A4 File Offset: 0x000003A4
	public virtual void OnEndOneSideAction(BattlePlayingCardDataInUnitModel curCard)
	{
	}

	// Token: 0x060024BF RID: 9407 RVA: 0x000021A4 File Offset: 0x000003A4
	public virtual void OnEndParrying()
	{
	}

	// Token: 0x060024C0 RID: 9408 RVA: 0x000021A4 File Offset: 0x000003A4
	public virtual void OnKill(BattleUnitModel target)
	{
	}

	// Token: 0x060024C1 RID: 9409 RVA: 0x000021A4 File Offset: 0x000003A4
	public virtual void OnUseCard(BattlePlayingCardDataInUnitModel card)
	{
	}

	// Token: 0x060024C2 RID: 9410 RVA: 0x000021A4 File Offset: 0x000003A4
	public virtual void OnDestroyCard(BattlePlayingCardDataInUnitModel card)
	{
	}

	// Token: 0x060024C3 RID: 9411 RVA: 0x000021A4 File Offset: 0x000003A4
	public virtual void BeforeRollDice(BattleDiceBehavior behavior)
	{
	}

	// Token: 0x060024C4 RID: 9412 RVA: 0x000021A4 File Offset: 0x000003A4
	public virtual void BeforeGiveDamage(BattleDiceBehavior behavior)
	{
	}

	// Token: 0x060024C5 RID: 9413 RVA: 0x000021A4 File Offset: 0x000003A4
	public virtual void AfterDiceAction(BattleDiceBehavior behavior)
	{
	}

	// Token: 0x060024C6 RID: 9414 RVA: 0x000021A4 File Offset: 0x000003A4
	public virtual void OnSuccessAttack(BattleDiceBehavior behavior)
	{
	}

	// Token: 0x060024C7 RID: 9415 RVA: 0x000021A4 File Offset: 0x000003A4
	public virtual void OnWinParrying(BattleDiceBehavior behavior)
	{
	}

	// Token: 0x060024C8 RID: 9416 RVA: 0x000021A4 File Offset: 0x000003A4
	public virtual void OnDrawParrying(BattleDiceBehavior behavior)
	{
	}

	// Token: 0x060024C9 RID: 9417 RVA: 0x000021A4 File Offset: 0x000003A4
	public virtual void OnLoseParrying(BattleDiceBehavior behavior)
	{
	}

	// Token: 0x060024CA RID: 9418 RVA: 0x000021A4 File Offset: 0x000003A4
	public virtual void OnPrintEffect(BattleDiceBehavior behavior)
	{
	}

	// Token: 0x060024CB RID: 9419 RVA: 0x000021A4 File Offset: 0x000003A4
	public virtual void OnTakeDamageByAttack(BattleDiceBehavior atkDice, int dmg)
	{
	}

	// Token: 0x060024CC RID: 9420 RVA: 0x000021A4 File Offset: 0x000003A4
	public virtual void OnFriendTakeDamageByAttack(BattleDiceBehavior atkDice, int dmg)
	{
	}

	// Token: 0x060024CD RID: 9421 RVA: 0x000894AD File Offset: 0x000876AD
	public virtual BattleUnitModel ChangeAttackTarget(BattleDiceCardModel card, int currentSlot)
	{
		return null;
	}

	// Token: 0x060024CE RID: 9422 RVA: 0x000F8415 File Offset: 0x000F6615
	public virtual int ChangeTargetSlot(BattleDiceCardModel card, BattleUnitModel target, int currentSlot, int targetSlot, bool teamkill)
	{
		return targetSlot;
	}

	// Token: 0x060024CF RID: 9423 RVA: 0x000E2C9F File Offset: 0x000E0E9F
	protected bool IsAttackDice(BehaviourDetail diceDetail)
	{
		return diceDetail == BehaviourDetail.Slash || diceDetail == BehaviourDetail.Penetrate || diceDetail == BehaviourDetail.Hit;
	}

	// Token: 0x060024D0 RID: 9424 RVA: 0x000F8406 File Offset: 0x000F6606
	protected bool IsDefenseDice(BehaviourDetail diceDetail)
	{
		return diceDetail == BehaviourDetail.Guard || diceDetail == BehaviourDetail.Evasion;
	}

	// Token: 0x060024D1 RID: 9425 RVA: 0x000021A4 File Offset: 0x000003A4
	public virtual void OnEndBattlePhase()
	{
	}

	// Token: 0x060024D2 RID: 9426 RVA: 0x000021A4 File Offset: 0x000003A4
	public virtual void OnLayerChanged(string layerName)
	{
	}

	// Token: 0x060024D3 RID: 9427 RVA: 0x000F8412 File Offset: 0x000F6612
	public virtual AtkResist GetResistHP(AtkResist origin, BehaviourDetail detail)
	{
		return origin;
	}

	// Token: 0x060024D4 RID: 9428 RVA: 0x000F8412 File Offset: 0x000F6612
	public virtual AtkResist GetResistBP(AtkResist origin, BehaviourDetail detail)
	{
		return origin;
	}

	// Token: 0x060024D5 RID: 9429 RVA: 0x000021A4 File Offset: 0x000003A4
	public virtual void OnRollDice(BattleDiceBehavior behavior)
	{
	}

	// Token: 0x060024D6 RID: 9430 RVA: 0x000021A4 File Offset: 0x000003A4
	public virtual void OnRollDiceInRecounter()
	{
	}

	// Token: 0x060024D7 RID: 9431 RVA: 0x000021A4 File Offset: 0x000003A4
	public virtual void OnHpZero()
	{
	}

	// Token: 0x060024D8 RID: 9432 RVA: 0x000894B0 File Offset: 0x000876B0
	public virtual bool CanRecoverHp(int amount)
	{
		return true;
	}

	// Token: 0x060024D9 RID: 9433 RVA: 0x000894B0 File Offset: 0x000876B0
	public virtual bool CanRecoverBreak(int amount)
	{
		return true;
	}

	// Token: 0x060024DA RID: 9434 RVA: 0x001035B8 File Offset: 0x001017B8
	public BattleBufUIData GetUIData()
	{
		return new BattleBufUIData
		{
			destroyed = this.IsDestroyed(),
			hide = this.hide,
			stack = this.stack,
			bufIcon = this.GetBufIcon(),
			bufActivatedText = this.bufActivatedText,
			bufActivatedNameWithStack = this.bufActivatedNameWithStack,
			bufClassType = base.GetType(),
			addDescStateText = this.GetAddTextData(),
			bufPositiveType = this.positiveType,
			buf = this
		};
	}

	// Token: 0x060024DB RID: 9435 RVA: 0x00005931 File Offset: 0x00003B31
	public virtual bool DirectAttack()
	{
		return false;
	}

	// Token: 0x060024DC RID: 9436 RVA: 0x000021A4 File Offset: 0x000003A4
	public virtual void OnRoundEndTheLast()
	{
	}

	// Token: 0x060024DD RID: 9437 RVA: 0x000021A4 File Offset: 0x000003A4
	public virtual void OnStartOneSideAction(BattlePlayingCardDataInUnitModel card)
	{
	}

	// Token: 0x060024DE RID: 9438 RVA: 0x000021A4 File Offset: 0x000003A4
	public virtual void OnStartTargetedOneSide(BattlePlayingCardDataInUnitModel attackerCard)
	{
	}

	// Token: 0x060024DF RID: 9439 RVA: 0x000021A4 File Offset: 0x000003A4
	public virtual void OnStartParrying(BattlePlayingCardDataInUnitModel card)
	{
	}

	// Token: 0x060024E0 RID: 9440 RVA: 0x000021A4 File Offset: 0x000003A4
	public virtual void BeforeTakeDamage(BattleUnitModel attacker, int dmg)
	{
	}

	// Token: 0x060024E1 RID: 9441 RVA: 0x000021A4 File Offset: 0x000003A4
	public virtual void BeforeLoseHPNotDmg(int dmg)
	{
	}

	// Token: 0x060024E2 RID: 9442 RVA: 0x000021A4 File Offset: 0x000003A4
	public virtual void OnLoseHp(int dmg)
	{
	}

	// Token: 0x060024E3 RID: 9443 RVA: 0x00005931 File Offset: 0x00003B31
	public virtual bool IsImmortal()
	{
		return false;
	}

	// Token: 0x060024E4 RID: 9444 RVA: 0x00005931 File Offset: 0x00003B31
	public virtual bool IsStraighten()
	{
		return false;
	}

	// Token: 0x060024E5 RID: 9445 RVA: 0x00005931 File Offset: 0x00003B31
	public virtual bool IsImmune(KeywordBuf buf)
	{
		return false;
	}

	// Token: 0x060024E6 RID: 9446 RVA: 0x000F8448 File Offset: 0x000F6648
	public virtual float DmgFactor(int dmg, DamageType type = DamageType.ETC, KeywordBuf keyword = KeywordBuf.None)
	{
		return 1f;
	}

	// Token: 0x060024E7 RID: 9447 RVA: 0x000F8448 File Offset: 0x000F6648
	public virtual float BreakDmgFactor(int dmg, DamageType type = DamageType.ETC, KeywordBuf keyword = KeywordBuf.None)
	{
		return 1f;
	}

	// Token: 0x060024E8 RID: 9448 RVA: 0x00005931 File Offset: 0x00003B31
	public virtual bool IsImmuneDmg(DamageType type, KeywordBuf keyword = KeywordBuf.None)
	{
		return false;
	}

	// Token: 0x060024E9 RID: 9449 RVA: 0x00005931 File Offset: 0x00003B31
	public virtual bool IsImmuneBreakDmg(DamageType type)
	{
		return false;
	}

	// Token: 0x060024EA RID: 9450 RVA: 0x00005931 File Offset: 0x00003B31
	public virtual bool IsImmune(BufPositiveType posType)
	{
		return false;
	}

	// Token: 0x060024EB RID: 9451 RVA: 0x00005931 File Offset: 0x00003B31
	public virtual bool IsImmune(BattleUnitBuf buf)
	{
		return false;
	}

	// Token: 0x060024EC RID: 9452 RVA: 0x00005931 File Offset: 0x00003B31
	public virtual bool IsImmuneDmg()
	{
		return false;
	}

	// Token: 0x060024ED RID: 9453 RVA: 0x000021A4 File Offset: 0x000003A4
	public virtual void OnBreakState()
	{
	}

	// Token: 0x060024EE RID: 9454 RVA: 0x00005931 File Offset: 0x00003B31
	public virtual bool TeamKill()
	{
		return false;
	}

	// Token: 0x060024EF RID: 9455 RVA: 0x00005931 File Offset: 0x00003B31
	public virtual bool IsNullifiedPower()
	{
		return false;
	}

	// Token: 0x060024F0 RID: 9456 RVA: 0x00005931 File Offset: 0x00003B31
	public virtual bool IsHalfPower()
	{
		return false;
	}

	// Token: 0x060024F1 RID: 9457 RVA: 0x00005931 File Offset: 0x00003B31
	public virtual int OnGiveKeywordBufByCard(BattleUnitBuf cardBuf, int stack, BattleUnitModel target)
	{
		return 0;
	}

	// Token: 0x060024F2 RID: 9458 RVA: 0x000894B0 File Offset: 0x000876B0
	public virtual int GetMultiplierOnGiveKeywordBufByCard(BattleUnitBuf cardBuf, BattleUnitModel target)
	{
		return 1;
	}

	// Token: 0x060024F3 RID: 9459 RVA: 0x00005931 File Offset: 0x00003B31
	public virtual int GetCardCostAdder(BattleDiceCardModel card)
	{
		return 0;
	}

	// Token: 0x060024F4 RID: 9460 RVA: 0x000F8419 File Offset: 0x000F6619
	public virtual int GetMinHp()
	{
		return -999;
	}

	// Token: 0x060024F5 RID: 9461 RVA: 0x00103640 File Offset: 0x00101840
	public string GetAddTextData()
	{
		string result = "";
		if (this.positiveType == BufPositiveType.Negative)
		{
			result = " \n<color=#FF0000>(" + TextDataModel.GetText("BattleUI_debuf", Array.Empty<object>()) + ")</color>";
		}
		return result;
	}

	// Token: 0x060024F6 RID: 9462 RVA: 0x000F8420 File Offset: 0x000F6620
	public virtual double ChangeDamage(BattleUnitModel attacker, double dmg)
	{
		return dmg;
	}

	// Token: 0x060024F7 RID: 9463 RVA: 0x000021A4 File Offset: 0x000003A4
	public virtual void ChangeDiceResult(BattleDiceBehavior behavior, ref int diceResult)
	{
	}

	// Token: 0x060024F8 RID: 9464 RVA: 0x000021A4 File Offset: 0x000003A4
	public virtual void OnEndBattle(BattlePlayingCardDataInUnitModel curCard)
	{
	}

	// Token: 0x0400266B RID: 9835
	private bool _destroyed;

	// Token: 0x0400266C RID: 9836
	public bool hide;

	// Token: 0x0400266D RID: 9837
	public int stack = 1;

	// Token: 0x0400266E RID: 9838
	private bool _iconInit;

	// Token: 0x0400266F RID: 9839
	private Sprite _bufIcon;

	// Token: 0x04002670 RID: 9840
	protected BattleUnitModel _owner;

	// Token: 0x04002671 RID: 9841
	public static Dictionary<string, Sprite> _bufIconDictionary = new Dictionary<string, Sprite>();
}
