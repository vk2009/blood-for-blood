# BLOOD FOR BLOOD — Story & Design Plan

> The rise of Emilio Gonzalez: a poor boy from Valparaíso who becomes a general under Pinochet, builds a business with the one friend he ever had, loses him at a pool in Mexico, and is reborn as **Gustavo Fring**.

**Genre:** Third-person, objective-driven story game (open hubs + linear missions, Spider-Man style).
**Tone:** Quiet, cold, patient. Violence is sudden and short. The player should feel every peso Emilio spends.
**Theme:** What do you give up to never be poor or powerless again? Each chapter takes something from him: his mother, his conscience, his best friend, his name.

---

## 1. Core Systems

### HUD
| Element | Where | What it shows |
|---|---|---|
| Objective | Top left | Chapter name, current objective, distance to target |
| Minimap | Top right | Streets, objective marker, danger zones (alleys/checkpoints) in red |
| Zone name | Under minimap | e.g. *Cerro Barón — Valparaíso* |
| Money | Top right | Pesos (later dollars) |
| Health | Bottom left | Health bar, shown during danger |
| Waypoint | In world | Diamond marker over the target |

### Inventory (`I`)
Key items, documents and money. Items carry story. Examples: *Coffee Tin of Savings*, *Train Ticket*, *Service ID*, *Savings Ledger*, *Mateo's Notebook*, *Medical Discharge*, *Schuler's Business Card*, *Gustavo Fring Passport*.

### Saving
- **Autosave after every cutscene.** Nowhere else automatically.
- **Manual save** from the pause menu (`Esc`) at any time, **except during a fight or a cutscene** (the option is greyed out with a short reason).
- A save stores: current objective, location and position, money, inventory, and all choice flags.
- **Game over** (lose a fight, get caught) → reload the **most recent save**, autosave or manual.
- The first save is the start of the game (after the prologue).

### Combat
Close-quarters fistfights: punch, kick, block, dodge, takedown on a stunned enemy. Later chapters add disarms, pistol (army chapter only) and environmental takedowns. Losing = game over.

### Choices & hidden stats
The "tough decisions" the plan calls for are tracked with four hidden values. They change dialogue, which missions open up, and some endings of scenes. They are never shown as numbers; the player feels them.

| Stat | Meaning | Raised by | Lowered by |
|---|---|---|---|
| **Savings** | Money for the escape (visible as pesos) | Stinginess, extortion | Charity, bribes, mistakes |
| **Heat** | How closely the regime/police watch him | Fights in public, helping Mateo, protest contact | Obedience, paying off the right people |
| **Bond (Mateo)** | How close Emilio and Mateo become | Trusting, protecting, sharing | Threats, cold choices |
| **Fear** | His reputation as someone not to cross | Brutality, extortion at full rate | Mercy |

**Rule:** No choice is free. Mercy costs money or raises Heat; cruelty raises Savings but costs Bond or something personal. The game should never flag one answer as "good".

---

## 2. Cast

| Character | Role |
|---|---|
| **Emilio Gonzalez** → **Gustavo Fring** | The player. Born poor in Valparaíso. Soldier, general, businessman. |
| **Mamá (Rosa Gonzalez)** | His mother. Works herself into the ground. Her death is the reason he leaves. |
| **Mateo Zagal** → **Max Arciniega** | A chemist forced to make product for the regime. Idealist from La Victoria. Emilio's only real friend. |
| **Víctor Díaz López** | Emilio's boot-camp rival who rises into the secret police (CNI). The man hunting Mateo. Main villain of Chapters I–II. *(See open questions.)* |
| **Dr. Herrera** | Army doctor. Takes the bribe for the medical discharge. |
| **Don Ernesto, Señora Inés, Don Jacobo** | Shopkeepers Emilio extorts as a general. |
| **Peter Schuler** | Madrigal Electromotive GmbH executive scouting partners in Chile. Funds Los Pollos and builds the new identities. |
| **Don Eladio Vuente** | Mexican cartel boss. Kills Max. Spares Gus because he knows who "the Generalísimo" was. |
| **Hector Salamanca** | Eladio's enforcer. Pulls the trigger on Max. |
| **Victor, Tyrus, Mike Ehrmantraut, Gale Boetticher** | Recruited in Chapter III. |

---

## 3. Timeline

| Year | Event |
|---|---|
| 1964 | Prologue: Emilio as a boy in Valparaíso |
| 1973 | Coup: Pinochet takes power (background only) |
| 1976 | Emilio, now 20s, leaves Cerro Barón for Santiago and enlists |
| 1976–80 | Boot camp, lieutenant, colonel |
| 1981 | Promoted to General. Five years of saving. Meets Mateo. |
| 1981–85 | The friendship. The plan. Los Pollos Hermanos is born. |
| 1983–86 | National protests against the regime grow. Heat rises. |
| 1986 | Revolt. Schuler gets them out. Mexico. Max dies. |
| 1987+ | Albuquerque. The empire. |

---

## 4. Prologue — Valparaíso, 1964

**Cutscene (short vignettes, ~3 min total):**
1. A tin-roof house on the hill. Mamá counting coins at the table, splitting them into "rent", "food", "nothing".
2. **Playable moment:** young Emilio throws fruit at the coati stealing from their table. (Small QTE / aim-and-throw.)
3. Mamá laughs for the first time in the scene; then sees the fruit was their dinner. She tells him she already ate. She didn't.
4. Night: Emilio watches her eat nothing. He hides a coin in a coffee tin. *(First item: Coffee Tin of Savings.)*

> **Lesson planted:** every peso is someone's dinner.

Hard cut → card: *Twelve years later.*

---

## 5. Chapter I — Chile

Chapter I is now split into three **Acts** so it plays longer and has more combat and choices.

### Act 1 — Cerro Barón (1976)

**Cutscene — Wake:** Emilio wakes in a small, dirty room. Mamá's bed is empty and made. A funeral card on the nail. (She died this year; this is why he can leave now.) **→ Autosave (start of game).**

| # | Objective | Type | Notes |
|---|---|---|---|
| 1 | Take your savings from under the mattress | Explore | Inventory tutorial. |
| 2 | Pay what you owe Doña Carmen (landlady) | **Choice** | Pay in full (–Savings) / pay half and promise / leave without paying (she curses him from the window; later a callback). |
| 3 | Walk to Estación Barón — stay out of the alleys | Stealth / route | Alleys glow red on the minimap. Entering one = mugging fight. Lose = game over. |
| 4 | *(Optional)* A kid is being robbed in an alley | **Choice** | Step in (fight, +Fear... and the kid's thanks) or keep walking (safe, keep schedule). |
| 5 | Buy a ticket and board the train to Santiago | Goal | Ticket goes in inventory. |

**Cutscene — The Train:** The coast disappears. Emilio counts the tin. **→ Autosave.**

### Act 2 — Boot Camp, Regimiento Tacna (1976–1980)

New, playable section (the current build only has this as a montage).

**Cutscene — Enlist:** Recruiting office. He lies about nothing; he just says he wants a salary. Card: *He sends nothing home. There is no one left to send it to. He spends nothing on himself.* **→ Autosave.**

| # | Objective | Type | Notes |
|---|---|---|---|
| 6 | Survive the first night in the barracks | Fight | **Víctor Díaz López**, a rich officer's son, and two friends "welcome" the new recruit. First real fight tutorial. |
| 7 | Morning drill / obstacle course | Timed traversal | Beat the clock to get noticed by the sergeant. |
| 8 | Rations are going missing | **Choice** | A thin recruit, Tomás, is stealing bread for his family. Report him (sergeant's favour, Tomás is beaten and expelled) / cover for him (lose rank points, Tomás owes you) / take a cut (+Savings, +Fear). |
| 9 | Sparring final vs. Víctor | Boss fight | Win or lose here doesn't end the game — **it decides the rivalry tone**. Winning humiliates Víctor in front of officers (he never forgets). |

**Cutscene — Promotion montage:** 1977 → 1978 Lieutenant ("cold, efficient, patient, never asks what the orders are for"). Víctor is quietly transferred to the CNI, the secret police. **→ Autosave.**

| # | Objective | Type | Notes |
|---|---|---|---|
| 10 | Lieutenant: escort a detained student to the transport | **Hard choice** | The student begs. You can (a) deliver him, (b) "lose" his paperwork so he's released (+Heat, Víctor notices the gap), (c) let him run and fire a shot in the air. Kept off-screen and non-graphic; the weight is in what Emilio chooses, not what's shown. |

Card: *1980 — Colonel.* **→ Autosave.**

### Act 3 — The General (Santiago, 1981)

**Cutscene — Rise:** Card: *1981 — General. Five years in uniform. Still living like a private.* He lives in a small, poor house within walking distance of the facility. Ledger in inventory: rent, bread, "coffee: no, cinema: no". **→ Autosave.**

| # | Objective | Type | Notes |
|---|---|---|---|
| 11 | Take your service ID from the table | Explore | |
| 12 | **The stingy morning** | Mini-choices | Street vendor, shoe-shine boy, a beggar who served under him. Each one: pay or don't. Every peso shows on screen. Mostly a characterization beat, small Bond callbacks later. |
| 13 | Collect "contributions" from the shopkeepers (0/3) | Extortion | Ernesto, Inés, Jacobo. Each: full rate (+Savings, +Fear) / half / forgive (pay their share yourself). Inés can be pushed into a fight with her son. |
| 14 | Thieves are robbing the market on Calle Agustinas | Fight | 3–4 enemies. Public fight; crowd remembers. |
| 15 | Walk to the Centro de Investigación Militar | Goal | |

**Cutscene — The Chase (Mateo):**
On the walk, a young man slams into him, **Mateo Zagal**, running. CNI sirens behind.
- Mateo tries to push past. **Emilio holds him by the collar.**
- Mateo: *"If they take me, I die. Not prison. I die."* Emilio: *"Then you should not have run."*
- Sirens close in. **Timed choice (QTE hold):** Emilio keeps his grip... until the last second, and lets go. Mateo dives into a gap between buildings.
- Police (led by **Víctor**) arrive. Emilio **feigns ignorance**, points the wrong way. Víctor stares too long. **→ Autosave.**

| # | Objective | Type | Notes |
|---|---|---|---|
| 16 | Show your ID at the facility gate | Goal | **Gate cutscene:** search, salute, metal door. Short "entering secure building" sequences every time. |
| 17 | Go to your office | Explore | |
| 18 | Search the chemistry lab for the intruder | Stealth search | Emilio finds Mateo hiding *inside his own facility*. Mateo is one of the regime's chemists, forced to make product for the streets. |

**Cutscene — Mateo (long dialogue scene with choices):**
- Emilio is furious: *"Five years of being invisible. You spent it in one morning."* He threatens to kill him or hand him over.
- Mateo explains: he grew up in La Victoria, mother cleaned houses in Providencia. He stole food from the police stores and gave it to the barrio. Got caught. Now he's running.
- Emilio says nothing about Cerro Barón… unless the player chooses to (big Bond moment).
- Mateo lets slip what he makes in the lab and **what it sells for on the street.** Emilio goes very quiet.
- **Choice:** hide him in the lab ("until I say otherwise") / tell him where you're from / take his notebook as insurance.

**→ Autosave. End of Chapter I.**

---

## 6. Chapter II — Los Pollos (1981–1986)

The emotional center of the game. Roughly as long as Chapter I. Every mission here should put Emilio and Mateo side by side.

### Act 1 — Getting Out (1981)

| # | Objective | Type | Notes |
|---|---|---|---|
| 1 | Keep Mateo hidden for a week | Stealth / routine | Day-cycle loop: bring food, avoid inspections, misdirect Víctor's men. |
| 2 | Get a medical discharge from Dr. Herrera | Bribe / choice | Pay (–Savings), blackmail (he has a secret; +Fear, –Bond if Mateo learns), or both. |

**Cutscene — Resignation:** "Medical problems." The commanding officer doesn't believe it but signs. Emilio walks out in civilian clothes for the first time. **→ Autosave.**

### Act 2 — The Partnership (1982–1983)

| # | Objective | Type | Notes |
|---|---|---|---|
| 3 | Talk to Mateo: the idea | Dialogue | Emilio proposes the operation. Mateo hates it: "We'd be the same poison." Emilio: "Then we'll be the clean ones. No children. No cut product. And the barrio eats." This is the deal that binds them. |
| 4 | Set up a lab | Scavenge | Gather glassware, chemicals and a hidden location (abandoned bakery basement). |
| 5 | **The first cook** | Minigame | Mateo cooks; the player handles timing/temperature with him. Purity matters later. |
| 6 | **The first sale** | Choice + fight | Sell to a street crew. They try to rob you; fight. Spare the leader (future distributor) or make an example (+Fear). |
| 7 | Choose a front for the money | **Idea board** | Player pins ideas: laundromat, car wash, pharmacy, taxi company… each is talked down (too regulated, too visible, too small). It always lands on **chicken**: Mateo's mother's recipe. |

### Act 3 — Los Pollos Hermanos (1983–1985)

Friendship missions. Mostly low-combat, high-character. Each raises Bond.

| # | Objective | Notes |
|---|---|---|
| 8 | Fix up the restaurant | Paint, sign, kitchen. Mateo insists on a logo with two brothers: "That's us." |
| 9 | The recipe | Mateo cooks his mother's chicken; Emilio refines the batter. Their first argument and first real laugh. |
| 10 | Opening night | Run the counter (serving minigame). The barrio comes. |
| 11 | Visit La Victoria with Mateo | Meet his mother. She feeds Emilio. Callback to the prologue: she says she already ate. Emilio insists she sits and eats. |
| 12 | Supply run through checkpoints | Drive product past army checkpoints. Some soldiers recognise "the General". Bluff or bribe. |
| 13 | Football in the street | Pure downtime. Mateo talks about wanting to leave Chile. Emilio says: "Together, then." |
| 14 | A dealer cuts the product and a child gets sick | **Hard choice**: kill the dealer (Fear, Mateo sees a new side of you) / exile him / turn him in (Heat). |

**Cutscene — Peter Schuler:** A German in a good suit orders a full meal and eats it slowly. **Madrigal Electromotive GmbH**, scouting partners under the regime. He has noticed how much money a small chicken place moves. He doesn't threaten. He offers. Item: *Schuler's Business Card.* **→ Autosave.**

| # | Objective | Notes |
|---|---|---|
| 15 | Meet Schuler at the Hotel Carrera | Negotiation choices. Mateo doesn't trust him. Emilio does what Emilio does: says yes, and keeps a copy of everything. |

### Act 4 — Blood in the Streets (1986)

**Cutscene — Revolt:** The national protests turn into street battles. A protester has a photo of the General extorting shopkeepers (callback to the Chapter I choices). And **Víctor Díaz López** has finally connected the General who "lost the runner" with the chemist who vanished. Both men are on lists, wanted by the regime and hated by the crowd. **→ Autosave.**

| # | Objective | Type | Notes |
|---|---|---|---|
| 16 | Get Mateo out of the restaurant | Combat / stealth | CNI raid. Fight through the kitchen. |
| 17 | Cross Avenida Matta through the riot | Escape | Barricades, tear gas, protesters who recognise the General. Shopkeepers you spared may hide you; ones you robbed shout your location. |
| 18 | **Víctor** | Boss fight | Final confrontation in a burning street. Choice at the end: kill him or leave him in the fire. |
| 19 | Reach Schuler's car at the north end | Goal | |

**Cutscene — New Names:** A safehouse. Schuler's people photograph them. Bribes, records, a buried past. Emilio becomes **Gustavo Fring**. Mateo becomes **Max Arciniega**. Max jokes about the name; Gus doesn't laugh, then does. Items: *Gustavo Fring passport*, *Max's photo*. **→ Autosave.**

### Act 5 — Generalísimo (Mexico, 1986)

**Cutscene — Mexico:** Desert, heat, a hacienda.

| # | Objective | Notes |
|---|---|---|
| 20 | Meet Don Eladio by the pool | Walk in through the hacienda. Show product samples. Eladio is charming. |

**Cutscene — The Pool (finale of Chapter II):**
- Eladio has learned that Max and Gus have been selling on his routes without permission. *They undercut him.*
- Hector Salamanca shoots Max at the edge of the pool. Gus is held down and forced to watch. Max's blood in the water.
- Eladio crouches: *"I know who you are… Generalísimo. That's the only reason you're alive."*
- No choice here. The player can only hold the button to reach for Max, and the guards hold him back.

**→ Autosave. End of Chapter II.**

---

## 7. Chapter III — Empire (Albuquerque, 1987 →)

The bulk of the game: open-world hub + management layer. Gus builds Los Pollos into a chain and the drug operation behind it, slowly, patiently, and waits.

### Empire systems
| System | What the player does |
|---|---|
| **Restaurants** | Open new Los Pollos locations (front income, laundering capacity) |
| **Product** | Lab quality and output; impacted by who your chemist is |
| **Distribution** | Routes, trucks, dealers; risk vs. reward |
| **Heat** | DEA and police attention; pay for cleanup or lay low |
| **Cartel tension** | Eladio takes a cut. Push too far too fast and he notices |
| **Crew** | Recruitable characters with abilities and loyalty |

### Recruitment arc (each is a mission chain)
| Character | How you meet | What they unlock |
|---|---|---|
| **Victor** | A young line cook who stays calm when the restaurant is robbed | Loyal right hand, driving, surveillance |
| **Tyrus** | Bouncer / ex-con, hired after a fight outside a location | Muscle, escort missions |
| **Mike Ehrmantraut** | Ex-cop with a past, hired for security consulting | Heists, cleanup, the "no half measures" missions |
| **Gale Boetticher** | Chemistry student; Gus funds his scholarship | Lab purity jump. Gus sees Max in him (emotional callback) |

### Chapter III goals
1. Build the first lab under a Madrigal-owned facility (Schuler's money).
2. Expand Los Pollos across the Southwest.
3. Recruit the four crew members.
4. Keep Eladio paid and calm, while quietly mapping everyone who was at the pool.

**End of Chapter III:** Gus visits Hector Salamanca years later. He says nothing. He just looks. Title card: **BLOOD FOR BLOOD.**

*(Optional Chapter IV: the revenge on Eladio's cartel. Can be added later as the finale the title promises.)*

---

## 8. Choice Callbacks (quick reference)

| Early choice | Pays off in |
|---|---|
| Landlady paid or not | Ch I Act 3 (she's in Santiago; a friendly or bitter face) |
| Kid in the alley helped | Ch II (the kid is now a street kid who warns you of the raid) |
| Tomás covered/reported | Ch II Act 4 (Tomás is a soldier at the barricade: lets you pass, or not) |
| Student released | Ch II Act 4 (Víctor uses it as evidence) |
| Shopkeepers forgiven/robbed | Ch II Act 4 (hide you or shout your name) |
| Told Mateo about Cerro Barón | Bond; unlocks extra friendship scene in La Victoria |
| Víctor killed or left | Ch III (a CNI file on "Gonzalez" exists or doesn't) |

---

## 9. What's Already Built vs. New

**Already in `js/story.js`:** Prologue (coati), wake, savings, alley walk, train, enlist + montage, rise, ID, extortion (3 shops), market thieves, the chase, gate, office, Mateo scene, discharge bribe, resignation, laundering board, opening, Schuler, revolt, escape, new names, Mexico, Eladio.

**New in this plan:**
- Mother's death as the reason he leaves; landlady choice
- Playable boot camp (Víctor fight, obstacle course, rations choice, sparring boss)
- Lieutenant prisoner choice
- Stingy-morning mini-choices
- Víctor Díaz López as the recurring villain, leading the chase and the raid
- Chapter II friendship missions (lab, first cook, first sale, recipe, La Victoria, checkpoints, football, cut-product choice)
- Víctor boss fight during the revolt
- Hidden stats (Savings / Heat / Bond / Fear) and callbacks
- Chapter III empire systems and recruitment

**Renumbering:** The build currently has five chapter titles (Prologue, Cerro Barón, The General, Los Pollos Hermanos, Blood in the Streets, Generalísimo). This plan folds them into **Prologue + three chapters with Acts**. Act names can reuse the existing titles.

---

## 10. Open Questions

1. **Who is Víctor Díaz López?** Your notes list him under Chapter I without a role. This plan makes him the boot-camp rival turned secret police hunter. Change if you had something else in mind.
2. **The coati:** coatis don't live in Chile in the wild. It could be a street vendor's escaped pet (one line of dialogue fixes it), or swap to a stray dog/seagull.
3. **Who kills Max?** Your notes say Eladio. This plan has Eladio order it and Hector shoot (matches the show). Keep or change?
4. **How long is Chapter III?** Is it a full management game, or a series of missions with light stat-building?
5. **Is there an optional Chapter IV (the revenge)?** The title suggests it.

---

## 11. Built: the rest of the story (testing branch)

The theme of everything after the pool is **revenge for Max**. The empire exists to make that revenge possible.

- **Chapter II ending** — After the pool, Gus can reach for Hector's pistol or go for Hector, but he is always forced out. He buries Max in the desert, along with Emilio (the coffee tin and half of Mamá's photo). From the passports on, he is only ever called Gustavo, and Mateo only Max.
- **Chapter III · Empire** (Albuquerque) — The ledger on the desk in Gus's office tracks Reputation, Product, Fear and Heat (0–100), plus money in dollars. You get two moves a week, then end the week to collect income and pay payroll and Eladio's 20% cut.
  - Heat at 100 triggers a DEA raid (a timed mission; lose it and you lose half the money).
  - Low reputation plus low fear triggers a mutiny gunfight. If both collapse completely, it's game over.
  - Crew missions: Victor (parking-lot fight), Tyrus (boss fistfight), Mike (find the leak, chase, half or full measure), Gale (scholarship and test cook), Saul (chase down a witness).
  - Strikes on the Salamancas: the tire shop raid (the ledger of names), the courier shipment (chase plus gunfight), and Rogelio, the man who held Gus down at the pool (boss fight).
  - The chapter ends when you have 5 crew, 3 strikes, 3 restaurants and 50 product. Hector comes to collect; Gus just looks at him.
- **Chapter IV · Catalyst / Blood for Blood**
  - Walter (killed Tuco). Investigate the Salamanca twins (3 informants), then choose an approach: ambush both, or tip off the DEA and fight one. Either way it's a boss fistfight with unblockable axe swings you must dodge.
  - Gale dies (off-screen). Eladio's men ambush the truck and Victor dies.
  - Gus fires Walter, but Jesse won't cook if Walter is killed, so you have to find another way.
  - Mexico with Mike and Jesse: the tequila, a gunfight down the drive, then a boss gunfight with Don Eladio (hurt him while he reloads, propane tanks, reinforcements). He ends up in his own pool.
- **Final showdown at Rancho Salamanca, in three stages:**
  1. A gunfight at the gate, with waves of men and propane tanks.
  2. Walter's bomb: search the sheds by following the ticking, then cut the wires in order.
  3. Hector: a boss who rings his bell for reinforcements and is only exposed while reloading.
  - Ending: Hector, Walter's fate (exile or Mike), Gus running the show, and the bell left on Max's grave.
- **Fixes:**
  - Combat is harder: tougher and faster enemies, combo breakers, heavier hits, and bosses.
  - Loading a save inside a fight zone now offers "E Fight…".
  - The obstacle course now has three shooting stations.
  - The hacienda pool is visible.
