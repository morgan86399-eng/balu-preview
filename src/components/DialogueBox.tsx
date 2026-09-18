import type { DialogueLine } from "../game/types.ts";

export default function DialogueBox({
  line,
  talking,
  onNext,
}: {
  line: DialogueLine;
  talking?: boolean;
  onNext: () => void;
}) {
  return (
    <button type="button" className="dialogue gold-frame" onClick={onNext}>
      {line.portrait ? (
        <img
          className={`portrait${talking ? " talk" : ""}`}
          src={line.portrait}
          alt={line.speaker}
          width={96}
          height={128}
        />
      ) : (
        <div className="portrait-slot" aria-hidden="true" />
      )}
      <div className="dialogue-body">
        <div className="who-plate">{line.speaker}</div>
        <p>{line.text}</p>
        <div className="dialogue-hint">輕觸繼續</div>
      </div>
    </button>
  );
}
