import { getLast } from "@starbeam/core-utils";
import type { Description } from "@starbeam/debug";
import {
  type ActiveFrame,
  type Frame,
  type Unsubscribe,
  TIMELINE,
} from "@starbeam/timeline";
import { expected, isPresent, verify } from "@starbeam/verify";

type InternalComponent = object;

export class ComponentFrame {
  #active: ActiveFrame<unknown> | null;
  #frame: Frame | null;
  #subscription: Unsubscribe | null;

  static #frames = new WeakMap<InternalComponent, ComponentFrame>();
  static #stack: InternalComponent[] = [];

  static get(component: InternalComponent): ComponentFrame | null {
    return ComponentFrame.#frames.get(component) ?? null;
  }

  static create(component: InternalComponent, description: Description): ComponentFrame {
    let frame = ComponentFrame.#frames.get(component);

    if (!frame) {
      frame = new ComponentFrame(null, null, null);
      ComponentFrame.#frames.set(component, frame);
    }

    return frame;
  }

  static start(component: InternalComponent, description: Description): void {
    const frame = ComponentFrame.create(component, description);
    
    ComponentFrame.#stack.push(component);
    frame.#start(description);
  }

  static isRenderingComponent(component: InternalComponent): boolean {
    const frame = ComponentFrame.#frames.get(component);

    return !!frame && frame.#active !== null;
  }

  static get current(): InternalComponent {
    const current = getLast(ComponentFrame.#stack);
    if (!current) {
      throw Error(
        "You are attempting to use a feature of Starbeam that depends on the current component, but no component is currently active."
      );
    }
    return current;
  }

  static end(component: InternalComponent, subscription?: () => void): Frame {
    const frame = ComponentFrame.#frames.get(component);

    verify(
      frame,
      isPresent,
      expected.when("in Preact's _diff hook").as("a tracking frame")
    );

    const end = frame!.#end(subscription);
    ComponentFrame.#stack.pop();
    return end;
  }

  static unmount(component: InternalComponent): void {
    const frame = ComponentFrame.#frames.get(component);

    if (frame) {
      frame.#unmount();
    }
  }

  private constructor(
    frame: Frame | null,
    active: ActiveFrame<unknown> | null,
    subscribed: Unsubscribe | null
  ) {
    this.#frame = frame;
    this.#active = active;
    this.#subscription = subscribed;
  }

  #start(description: Description): void {
    if (this.#frame) {
      this.#active = TIMELINE.frame.update({ updating: this.#frame });
    } else {
      this.#active = TIMELINE.frame.create({
        description,
      });
    }
  }

  #end(subscription: (() => void) | undefined): Frame {
    verify(
      this.#active,
      isPresent,
      expected.when("in preact's _diff hook").as("an active tracking frame")
    );

    const frame = (this.#frame = this.#active!.finalize(null, TIMELINE).frame);

    this.#active = null;

    if (subscription) {
      this.#subscription = TIMELINE.on.change(frame, subscription);
    }

    return frame;
  }

  #unmount(): void {
    if (this.#subscription) {
      this.#subscription();
      this.#subscription = null;
    }
  }
}
