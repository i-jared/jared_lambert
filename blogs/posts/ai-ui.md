---
title: First Commit
date: 2026-05-13
description: The UI of AI
slug: ai-ui
---

At the time of writing, the perfect UI for managing AI agents for your work and coding hasn't been created, but we're close. We've been skirting around the edges. Prominent contenders include Conductor, Codex, Cursor, and Hermes Agent. I'm telling you, we're close! And I think Codex will get there eventually. Here's what they need:

- Simple input interface - STT and typing
- Strong coding agent
- Orchestration of coding agents
- Separate contexts
- Mobile-friendly platform

Let's break down each point:

### input interfaces
Most apps are focused on typing only. For the future of software engineering, I think we need flexible speech inputs as well. I don't want to be tied to my desk anymore. I want to be free! That means voice input for mobile use as well as typing input. 

### Strong coding agent
Many strong contenders here: Opencode + Kimi, Cursor + composer2, but the undisputed champ right now is Codex + GPT 5.5. As long as you have a good one, that's all you need. We're flexible here.

### Orchestration
This is one of the biggest things we're missing at this point. Hermes is the best attempt so far, but it's lacking. I honestly haven't tried tools like Gas Town - it seems so convoluted, it couldn't possibly be the right solution. The thing is that *our orchestrator doesn't have to be smart*, it just has to be good at orchestrating. 

Let me give you an example of what I mean: Let's say I'm building a new website with a frontend and backend, and I want to build a certain feature. My instructions should be on the level of: "build the UI for this feature and the endpoints we need". The orchestrator should then communicate with the smart coding agent in a way that works for the coding agent. 

I've been using Coding agents for ~100% of my development since Jan 2025. In that time I've learned when a feature should be split into smaller tasks, when I can delegate to subagents or separate coding agent instances, how to best communicate to the agent, etc. My orchestrator just needs to understand those things - I just need it to understand how to hand the heavy lifting off to Codex.

**It should go something like this:**
me > "go build this feature"
orchestrator > "ok!"
orchestrator > "codex, how should we build this feature?"
codex > "we need this UI and these endpoints"
orchestrator > "create sub agents to build these" OR "codex 1, build this. codex 2, build this."

### Mobile friendly
I'm tired of sitting at a desk with my computer! I was born to roam free! We need a platform that can work locally from my desktop and managed from a mobile platform connected over tailscale. I haven't had a lot of luck with remote workspaces up to this point. The environment is hard to configure just right, and it seems like it never runs properly. I already have everything running on my computer - let's just use that.



So I'm probably going to build this if no one else does! I think Codex is going to get there but I'm not sure if I want to wait 6 months for it to happen. 
