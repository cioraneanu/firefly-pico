export const TUTORIAL_CONSTANTS = {
  assistant: {
    title: 'Transaction assistant',
    body: `
      <p>Easily create transactions by typing text here (or using your phone's dictation).</p>
      <p>Expected format: "[Name of tag / category / template] [amount] [description]"</p>
      <p>This searches your tags, categories and transaction-templates. It supports entering just part of the name and even getting some of the letters wrong.</p>
      <p>The "amount" part supports mathematical expressions(<code>Ex. 100/4+24*7</code>). Numbers separated by a space get automatically added up.</p>
      <div>Examples</div>
      <p><code>"template 23" <br> "templ 12 22 33" <br> "tmplat 12+2*3"<br> "tmplat 12+2*3 custom description"</code></p>
    `,
  },

  todoTag: {
    title: 'Todo Tag',
    body: `
      <p>One of your Tags can be marked as your "todo". This is useful for knowing which transactions require some later edits and you easily keep an eye on them straight from the dashboard</p>
      <p><code>Ex. If you're buying multiple items with the intent to keep only some of them and return the rest.</code></p>
      <p>There can only be one "todo" tag so setting a second one will clear it from the first one.</p>
    `,
  },
}
