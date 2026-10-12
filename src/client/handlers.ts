import type { ConfirmChannel } from "amqplib";
import type { ArmyMove, RecognitionOfWar } from "../internal/gamelogic/gamedata.js";
import type { GameState, PlayingState } from "../internal/gamelogic/gamestate.js";
import { handleMove, MoveOutcome } from "../internal/gamelogic/move.js";
import { handlePause } from "../internal/gamelogic/pause.js";
import { AckType } from "../internal/pubsub/consume.js";
import { publishJSON } from "../internal/pubsub/publish.js";
import { ExchangePerilTopic, WarRecognitionsPrefix } from "../internal/routing/routing.js";
import { handleWar, WarOutcome } from "../internal/gamelogic/war.js";

export function handlerPause(gs: GameState): (ps: PlayingState) => AckType{
    return (ps: PlayingState): AckType => {
        handlePause(gs, ps);
        process.stdout.write("> ");
        return AckType.Ack;
    }
}

export function handlerMove(gs: GameState, cc: ConfirmChannel): (am: ArmyMove) => AckType {
    return (am: ArmyMove): AckType => {
        try {
            const outcome = handleMove(gs, am);
            switch (outcome) {
                case MoveOutcome.Safe:
                    AckType.Ack;
                case MoveOutcome.MakeWar:
                    const rw: RecognitionOfWar = {
                        attacker: am.player,
                        defender: gs.getPlayerSnap(),
                    };
                    publishJSON(cc, ExchangePerilTopic, WarRecognitionsPrefix + "." + gs.getUsername, rw)
                    return AckType.NackRequeue;
                default:
                    return AckType.NackDiscard;
            }
        } finally {
            process.stdout.write("> ");
        }
    };
}

export function handlerWar(gs: GameState): (rw: RecognitionOfWar) => AckType {
    return (rw: RecognitionOfWar): AckType => {
        const warResolution = handleWar(gs, rw);
        process.stdout.write("> ");
        switch (warResolution.result) {
            case WarOutcome.NotInvolved:
                return AckType.NackRequeue;
            case WarOutcome.NoUnits:
                return AckType.NackDiscard;
            case WarOutcome.OpponentWon:
                return AckType.Ack;
            case WarOutcome.YouWon:
                return AckType.Ack;
            case WarOutcome.Draw:
                return AckType.Ack;
        
            default:
                console.error("war resolution not reached.")
                return AckType.NackDiscard;
        }

    }
}