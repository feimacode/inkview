const lastMessage = async (events) => (await events()).find((e) => e.message)?.message.content[0].text;

const active = (frame) =>
  frame.locator("body").evaluate(() => {
    const el = document.activeElement;
    return el?.getAttribute("name") ?? el?.textContent?.trim() ?? "";
  });

export default {
  async "renders every field type with labels, help and defaults"({ render, examples, assert }) {
    const frame = await render(examples[0].data);
    await frame.locator(".fm").waitFor();

    const control = async (label) => {
      const el = frame.getByLabel(label);
      return el.evaluate((node) => ({
        tag: node.tagName.toLowerCase(),
        type: node.getAttribute("type"),
        value: node.value,
        ...(node instanceof HTMLInputElement ? { checked: node.checked } : {}),
        min: node.getAttribute("min"),
        max: node.getAttribute("max"),
      }));
    };

    assert.deepEqual(await control("Destination"), { tag: "input", type: "text", value: "", checked: false, min: null, max: null });
    assert.deepEqual(await control("Anything else"), { tag: "textarea", type: null, value: "", min: null, max: null });
    assert.deepEqual(await control("Nights"), { tag: "input", type: "number", value: "3", checked: false, min: "1", max: "14" });
    assert.deepEqual(await control("Start date"), {
      tag: "input",
      type: "date",
      value: "",
      checked: false,
      min: "2026-11-15",
      max: "2026-12-20",
    });
    assert.deepEqual(await control("Contact email"), { tag: "input", type: "email", value: "", checked: false, min: null, max: null });
    assert.deepEqual(await control("Reference link"), { tag: "input", type: "url", value: "", checked: false, min: null, max: null });
    assert.deepEqual(await control("I can join remotely"), { tag: "input", type: "checkbox", value: "on", checked: false, min: null, max: null });

    const select = frame.getByLabel("Getting there");
    assert.equal(await select.evaluate((node) => node.tagName.toLowerCase()), "select");
    assert.equal(await select.inputValue(), "Train");
    assert.deepEqual(await select.locator("option").allTextContents(), ["None", "Train", "Plane", "Car"]);

    const dietary = frame.getByRole("group", { name: "Dietary needs" });
    assert.equal(await dietary.getByRole("checkbox").count(), 4);
    assert.deepEqual(await dietary.locator("label").allTextContents(), ["Vegetarian", "Vegan", "Gluten free", "Nut free"]);
    assert.equal(await dietary.getByRole("checkbox", { checked: true }).count(), 0);

    assert.deepEqual(await frame.locator(".fm-help").allTextContents(), [
      "City or region",
      "Pick all that apply",
      "Optional, up to a few sentences",
      "The booking page, if you have one",
    ]);
    const describedBy = await frame.getByLabel("Destination").getAttribute("aria-describedby");
    assert.equal(await frame.locator(`[id="${describedBy}"]`).textContent(), "City or region");
    assert.deepEqual(await frame.locator(".fm-required").count(), 4);
  },

  async "fills the form and submits with the keyboard only"({ render, events, page, assert }) {
    const frame = await render({
      title: "Keyboard",
      fields: [
        { name: "name", label: "Your name", type: "text", required: true },
        { name: "days", label: "Days", type: "number", min: 1, max: 9 },
        { name: "travel", label: "Travel", type: "select", options: ["Train", "Plane"], default: "Train" },
        { name: "remote", label: "Join remotely", type: "checkbox" },
      ],
    });
    await frame.locator(".fm").waitFor();
    await frame.locator("body").click({ position: { x: 1, y: 1 } });

    await page.keyboard.press("Tab");
    assert.equal(await active(frame), "name");
    await page.keyboard.type("Ada");

    await page.keyboard.press("Tab");
    assert.equal(await active(frame), "days");
    assert.equal(await frame.getByLabel("Days").inputValue(), "");
    await page.keyboard.type("3");

    await page.keyboard.press("Tab");
    assert.equal(await active(frame), "travel");
    await page.keyboard.press("ArrowDown");
    assert.equal(await frame.getByLabel("Travel").inputValue(), "Plane");

    await page.keyboard.press("Tab");
    assert.equal(await active(frame), "remote");
    await page.keyboard.press("Space");
    assert.equal(await frame.getByLabel("Join remotely").isChecked(), true);

    await page.keyboard.press("Tab");
    assert.equal(await active(frame), "Submit");
    await page.keyboard.press("Enter");

    await page.waitForTimeout(100);
    const message = await lastMessage(events);
    assert.match(message, /^Keyboard\n\nYour name: Ada\nDays: 3\nTravel: Plane\nJoin remotely: Yes$/);
  },

  async "blocks submit on required fields and focuses the first error"({ render, events, page, assert }) {
    const frame = await render({
      title: "Contact",
      fields: [
        { name: "name", label: "Your name", type: "text", required: true },
        { name: "nickname", label: "Nickname", type: "text" },
        { name: "email", label: "Contact email", type: "email", required: true },
      ],
    });
    await frame.locator(".fm").waitFor();
    assert.equal((await events()).length, 0);

    await frame.getByRole("button", { name: "Submit" }).click();
    await frame.locator(".fm-error").first().waitFor();
    await page.waitForTimeout(100);
    assert.deepEqual(await frame.locator(".fm-error").allTextContents(), ["Required", "Required"]);
    assert.equal(await frame.getByLabel("Your name").getAttribute("aria-invalid"), "true");
    assert.equal(await active(frame), "name");
    const nameError = await frame.getByLabel("Your name").getAttribute("aria-describedby");
    assert.equal(await frame.locator(`[id="${nameError}"]`).textContent(), "Required");
    assert.equal((await events()).length, 0);

    await frame.getByLabel("Your name").fill("Ada");
    await frame.getByRole("button", { name: "Submit" }).click();
    await frame.locator(".fm-error").first().waitFor();
    await page.waitForTimeout(100);
    assert.deepEqual(await frame.locator(".fm-error").allTextContents(), ["Required"]);
    assert.equal(await frame.getByLabel("Contact email").getAttribute("aria-invalid"), "true");
    assert.equal(await active(frame), "email");

    await frame.getByLabel("Contact email").fill("ada@example.com");
    await frame.locator(".fm-error").waitFor({ state: "detached" });
    await frame.getByRole("button", { name: "Submit" }).click();
    await frame.locator(".fm-status").waitFor();
    assert.equal(await frame.locator(".fm-status").textContent(), "Sent");
    assert.match(await lastMessage(events), /^Contact\n\nYour name: Ada\nNickname: —\nContact email: ada@example.com$/);
  },

  async "shows range and format errors and moves focus as they are fixed"({ render, events, page, assert }) {
    const frame = await render({
      title: "Booking",
      fields: [
        { name: "days", label: "Days", type: "number", min: 1, max: 9 },
        { name: "when", label: "When", type: "date", min: "2026-11-15", max: "2026-12-20" },
        { name: "email", label: "Contact email", type: "email" },
        { name: "site", label: "Site", type: "url" },
      ],
    });
    await frame.locator(".fm").waitFor();

    await frame.getByLabel("Days").fill("99");
    await frame.getByLabel("When").fill("2027-01-01");
    await frame.getByLabel("Contact email").fill("not-an-email");
    await frame.getByLabel("Site").fill("ftp://example.com");

    await frame.getByRole("button", { name: "Submit" }).click();
    await frame.locator(".fm-error").first().waitFor();
    await page.waitForTimeout(100);
    assert.deepEqual(await frame.locator(".fm-error").allTextContents(), [
      "Enter a number from 1 to 9.",
      "Enter a date from 2026-11-15 to 2026-12-20.",
      "Enter an email address.",
      "Enter a URL starting with http:// or https://.",
    ]);
    assert.equal(await active(frame), "days");
    assert.equal((await events()).length, 0);

    await frame.getByLabel("Days").fill("3");
    await frame.getByRole("button", { name: "Submit" }).click();
    await page.waitForTimeout(100);
    assert.deepEqual(await frame.locator(".fm-error").allTextContents(), [
      "Enter a date from 2026-11-15 to 2026-12-20.",
      "Enter an email address.",
      "Enter a URL starting with http:// or https://.",
    ]);
    assert.equal(await active(frame), "when");

    await frame.getByLabel("When").fill("2026-12-01");
    await frame.getByLabel("Contact email").fill("ada@example.com");
    await frame.getByLabel("Site").fill("https://example.com/booking");
    await frame.getByRole("button", { name: "Submit" }).click();
    await frame.locator(".fm-status").waitFor();
    assert.match(
      await lastMessage(events),
      /^Booking\n\nDays: 3\nWhen: 2026-12-01\nContact email: ada@example.com\nSite: https:\/\/example\.com\/booking$/,
    );
  },

  async "locks the form read-only after submitting"({ render, events, assert }) {
    const frame = await render({
      title: "Survey",
      submitLabel: "Send answers",
      fields: [
        { name: "name", label: "Your name", type: "text", required: true },
        { name: "plan", label: "Plan", type: "select", options: ["Free", "Pro"] },
        { name: "agree", label: "Agree to the terms", type: "checkbox" },
      ],
    });
    await frame.locator(".fm").waitFor();

    await frame.getByLabel("Your name").fill("Ada");
    await frame.getByLabel("Plan").selectOption("Pro");
    await frame.getByLabel("Agree to the terms").check();
    await frame.getByRole("button", { name: "Send answers" }).click();
    await frame.locator(".fm-status").waitFor();

    assert.equal(await frame.locator(".fm-status").textContent(), "Sent");
    assert.equal(await lastMessage(events), "Survey\n\nYour name: Ada\nPlan: Pro\nAgree to the terms: Yes");

    const controls = await frame
      .locator(".fm input, .fm select, .fm textarea, .fm button")
      .evaluateAll((nodes) => nodes.map((node) => ({ tag: node.tagName.toLowerCase(), disabled: node.disabled })));
    assert.ok(controls.length >= 5, "all controls are present");
    assert.deepEqual(
      controls.filter((node) => !node.disabled),
      [],
      "every control is read-only after submit",
    );

    await frame.getByRole("button", { name: "Send answers" }).click({ force: true });
    await new Promise((resolve) => setTimeout(resolve, 100));
    assert.equal((await events()).length, 1, "a locked form does not send again");
  },

  async "cancel tells the host the user declined the form"({ render, events, assert }) {
    const frame = await render({
      title: "Dinner",
      fields: [{ name: "meal", label: "Meal", type: "text" }],
    });
    await frame.locator(".fm").waitFor();

    await frame.getByRole("button", { name: "Cancel" }).click();
    await frame.locator(".fm-status").waitFor();
    assert.equal(await frame.locator(".fm-status").textContent(), "Cancelled");
    assert.equal(await lastMessage(events), 'I declined the form "Dinner".');
    assert.equal(await frame.getByLabel("Meal").isDisabled(), true);
    assert.equal(await frame.getByRole("button", { name: "Cancel" }).isDisabled(), true);

    const untitled = await render({ fields: [{ name: "meal", label: "Meal", type: "text" }] });
    await untitled.locator(".fm").waitFor();
    await untitled.getByRole("button", { name: "Cancel" }).click();
    await untitled.locator(".fm-status").waitFor();
    assert.equal(await lastMessage(events), "I declined the form.");
  },
};
