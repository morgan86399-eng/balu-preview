import { useState } from "react";
import { ENEMIES, JOURNAL, WEAPON_LABEL, heroById } from "../game/data.ts";
import { ITEMS, equipBonuses, itemById, statScale } from "../game/items.ts";
import type { GameSave, Weapon } from "../game/types.ts";

type Tab = "party" | "bag" | "equip" | "journal" | "clues";

export default function MenuOverlay({
  save,
  onClose,
  onSave,
  onTitle,
  onWorldMap,
  onPartySelect,
  onSettings,
  onBuy,
  onEquip,
  onUnequip,
}: {
  save: GameSave;
  onClose: () => void;
  onSave: () => void;
  onTitle: () => void;
  onWorldMap?: () => void;
  onPartySelect?: () => void;
  onSettings?: () => void;
  onBuy: (itemId: string) => void;
  onEquip: (itemId: string) => void;
  onUnequip: (slot: "weapon" | "armor") => void;
}) {
  const [tab, setTab] = useState<Tab>("party");
  const bonus = equipBonuses(save.equip);
  const weaponItem = save.equip?.weapon ? itemById(save.equip.weapon) : undefined;
  const armorItem = save.equip?.armor ? itemById(save.equip.armor) : undefined;
  const bagEquips = ITEMS.filter(
    (it) => (it.kind === "weapon" || it.kind === "armor") && (save.items[it.id] ?? 0) > 0,
  );

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="列傳選單">
      <div className="sheet gold-frame">
        <h2>列傳</h2>
        <p style={{ color: "var(--muted)", marginTop: 0 }}>
          金錢 {save.gold} · 等級 {save.level} · 閱歷 {save.exp}
        </p>
        <div className="menu-tabs" role="tablist" aria-label="列傳分頁">
          <button type="button" className={`btn${tab === "party" ? " on" : ""}`} onClick={() => setTab("party")}>
            狀態
          </button>
          <button type="button" className={`btn${tab === "bag" ? " on" : ""}`} onClick={() => setTab("bag")}>
            行囊
          </button>
          <button type="button" className={`btn${tab === "equip" ? " on" : ""}`} onClick={() => setTab("equip")} data-qa="tab-equip">
            裝備
          </button>
          <button type="button" className={`btn${tab === "journal" ? " on" : ""}`} onClick={() => setTab("journal")}>
            記事
          </button>
          <button type="button" className={`btn${tab === "clues" ? " on" : ""}`} onClick={() => setTab("clues")}>
            見聞
          </button>
        </div>
        {tab === "party" && (
          <div className="list-btns">
            {save.party.map((id) => {
              const h = heroById(id);
              const v = save.vitals[id];
              const atk = statScale(h.atk, save.level) + (id === save.heroId ? bonus.atk : 0);
              const def = statScale(h.def, save.level) + (id === save.heroId ? bonus.def : 0);
              const showBonus = id === save.heroId && (bonus.atk > 0 || bonus.def > 0);
              return (
                <div key={id} className="gold-frame chip">
                  <b>
                    {h.name} · {h.jobName}
                  </b>
                  <div>
                    氣血 {v?.hp ?? "—"} / 氣力 {v?.sp ?? "—"}
                  </div>
                  <div data-qa="status-atk-def">
                    攻 {atk} · 防 {def}
                    {showBonus && (
                      <span className="equip-stat-delta">
                        （裝＋{bonus.atk}/{bonus.def}）
                      </span>
                    )}
                    {!showBonus && <span className="equip-stat-delta zero"> </span>}
                  </div>
                </div>
              );
            })}
            {Object.keys(save.weaknessLog ?? {}).length > 0 && (
              <div className="gold-frame chip" style={{ marginTop: 8 }}>
                <b>已識弱點</b>
                <div style={{ marginTop: 4, color: "var(--muted)" }}>
                  {Object.entries(save.weaknessLog)
                    .map(([eid, weapons]) => {
                      const e = ENEMIES[eid];
                      const labels = (weapons as Weapon[])
                        .map((w) => WEAPON_LABEL[w] ?? w)
                        .join("／");
                      return `${e?.name ?? eid}：${labels}`;
                    })
                    .join("；")}
                </div>
              </div>
            )}
          </div>
        )}
        {tab === "bag" && (
          <div className="list-btns">
            {ITEMS.map((it) => (
              <div key={it.id} className="gold-frame chip" style={{ marginBottom: 6 }}>
                <b>
                  {it.name} ×{save.items[it.id] ?? 0}
                </b>
                <div style={{ marginTop: 4, color: "var(--muted)" }}>{it.desc}</div>
                <button type="button" className="btn" style={{ marginTop: 6 }} onClick={() => onBuy(it.id)}>
                  買 {it.price} 錢
                </button>
              </div>
            ))}
          </div>
        )}
        {tab === "equip" && (
          <div className="list-btns" data-qa="equip-panel">
            <div className="equip-slot-row">
              <div className="gold-frame chip">
                <b>武器</b>
                <div style={{ marginTop: 4 }}>
                  {weaponItem ? `${weaponItem.name}（攻＋${weaponItem.atkBonus ?? 0}）` : "（空）"}
                </div>
                {weaponItem && (
                  <button type="button" className="btn" style={{ marginTop: 6 }} onClick={() => onUnequip("weapon")}>
                    卸下
                  </button>
                )}
              </div>
              <div className="gold-frame chip">
                <b>防具</b>
                <div style={{ marginTop: 4 }}>
                  {armorItem ? `${armorItem.name}（防＋${armorItem.defBonus ?? 0}）` : "（空）"}
                </div>
                {armorItem && (
                  <button type="button" className="btn" style={{ marginTop: 6 }} onClick={() => onUnequip("armor")}>
                    卸下
                  </button>
                )}
              </div>
            </div>
            <p style={{ color: "var(--muted)", marginTop: 0 }}>從行囊裝備：</p>
            {bagEquips.length === 0 && (
              <p style={{ color: "var(--muted)" }}>行囊尚無可裝備物。可向商販購買精鐵槍或皮甲。</p>
            )}
            {bagEquips.map((it) => (
              <div key={it.id} className="gold-frame chip" style={{ marginBottom: 6 }}>
                <b>
                  {it.name} ×{save.items[it.id] ?? 0}
                </b>
                <div style={{ marginTop: 4, color: "var(--muted)" }}>
                  {it.desc}
                  {it.atkBonus ? ` · 攻＋${it.atkBonus}` : ""}
                  {it.defBonus ? ` · 防＋${it.defBonus}` : ""}
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ marginTop: 6 }}
                  data-qa={`equip-${it.id}`}
                  onClick={() => onEquip(it.id)}
                >
                  裝備
                </button>
              </div>
            ))}
            {(bonus.atk > 0 || bonus.def > 0) && (
              <div className="gold-frame chip" style={{ marginTop: 8 }}>
                <b>裝備加成</b>
                <div className="equip-stat-delta" style={{ marginTop: 4 }}>
                  攻＋{bonus.atk} · 防＋{bonus.def}
                </div>
              </div>
            )}
          </div>
        )}
        {tab === "journal" && (
          <div>
            {save.journal.length === 0 && <p style={{ color: "var(--muted)" }}>尚未記下大事。</p>}
            {save.journal.map((id) => {
              const j = JOURNAL[id];
              return (
                <div key={id} className="gold-frame chip" style={{ marginBottom: 8 }}>
                  <b>{j?.title ?? id}</b>
                  <div style={{ marginTop: 4 }}>{j?.body}</div>
                </div>
              );
            })}
          </div>
        )}
        {tab === "clues" && (
          <div>
            {(save.clues?.length ?? 0) === 0 &&
              Object.keys(save.weaknessLog ?? {}).length === 0 && (
              <p style={{ color: "var(--muted)" }}>尚未探聽到線索。對人使用探聽或勸誘。</p>
            )}
            {(save.clues ?? []).map((c, i) => (
              <div key={`${i}-${c.slice(0, 12)}`} className="gold-frame chip" style={{ marginBottom: 8 }}>
                <b>見聞 {i + 1}</b>
                <div style={{ marginTop: 4 }}>{c}</div>
              </div>
            ))}
            {Object.entries(save.weaknessLog ?? {}).map(([eid, weapons]) => {
              const e = ENEMIES[eid];
              const labels = (weapons as Weapon[])
                .map((w) => WEAPON_LABEL[w] ?? w)
                .join("／");
              return (
                <div key={`w-${eid}`} className="gold-frame chip" style={{ marginBottom: 8 }}>
                  <b>弱點・{e?.name ?? eid}</b>
                  <div style={{ marginTop: 4 }}>{labels || "—"}</div>
                </div>
              );
            })}
          </div>
        )}
        <div className="btn-row" style={{ marginTop: 12 }}>
          <button type="button" className="btn btn-primary" onClick={onSave} data-qa="menu-save">
            讀取／存檔
          </button>
          {onWorldMap && (
            <button type="button" className="btn" onClick={onWorldMap} data-qa="menu-world-map">
              天下圖
            </button>
          )}
          {onPartySelect && (
            <button type="button" className="btn" onClick={onPartySelect} data-qa="menu-party-select">
              編隊
            </button>
          )}
          {onSettings && (
            <button type="button" className="btn" onClick={onSettings} data-qa="menu-settings">
              設定
            </button>
          )}
          <button type="button" className="btn" onClick={onClose}>
            關閉
          </button>
          <button type="button" className="btn" onClick={onTitle}>
            回標題
          </button>
        </div>
      </div>
    </div>
  );
}
