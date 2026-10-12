import type { GameState, PlayingState } from "../internal/gamelogic/gamestate.js";
import { handlePause } from "../internal/gamelogic/pause.js";
import { AckType } from "../internal/pubsub/consume.js";

export function handlerPause(gs: GameState): (ps: PlayingState) => AckType{
    return (ps: PlayingState) => {
        handlePause(gs, ps);
        console.log("> ")
        return AckType.Ack;
    }
}