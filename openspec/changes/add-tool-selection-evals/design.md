# Design

## Context

See proposal.md. Components and guidance land in other changes; this one only measures.

## Goals / Non-Goals

**Goals:**
- Runs in minutes for under a few dollars, so it is used often.

**Non-Goals:**
- Benchmarking many vendors; one current Claude model is the baseline, others added later.

## Decisions

**Runner calls the Anthropic Messages API directly with Inkview's tool definitions,** read from the built server via `tools/list`, so evals test the real descriptions and schemas. Each prompt carries "source data" (as if from a search tool) that the model must render; invented values are found by checking each string field against it.

**Two configurations per run:** tools only, and tools plus the Skill text as a system prompt, to measure what `add-host-integrations` adds.

**Repeat each prompt 3 times** and report the pass rate, since choice is stochastic.

## Risks / Trade-offs

- [API cost and secrets in CI] → On-demand and pre-release runs only; key stored as a repository secret.
- [Overfitting descriptions to the eval set] → Keep 20% of prompts held out and report them separately.
