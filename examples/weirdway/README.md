# WeirdWay architectural reference (synthetic)

Raw source → JSON-LD encyclopedia → characters, locations and comic grammar → candidate discovery → decision layer → Page Context Compiler → Page Context JSON → replaceable image provider → comic page → reviewed continuity update.

No actual WeirdWay site, private assets, source code or canon was copied. Yastrik's yellow coat and the station data are invented fixtures. task.json specifies three panels and previous-page sleeve continuity. state.json also contains unrelated bakery history, excluded from this task. Run npm run demo to inspect the complete schema-valid Page Context and trace. task-context.json is the generated Page Context fixture.

An actual implementation connects an image provider such as ChatGPT, validates the page against comic rules and derives approved continuity. The included generation provider emits a JSON preview only. Attach examples/jsonld-context.json to the entity graph for the JSON-LD representation; replace its synthetic namespace with your own versioned ontology.
