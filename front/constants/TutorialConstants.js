export const TUTORIAL_CONSTANTS = {
  assistant: {
    title: 'Transaction assistant',
    body: `
      <p>Easily create transactions by typing text here (or using your phone's dictation).</p>
      <p>Expected format:<br> <b>[search]&nbsp; [amount?]&nbsp; [description?]&nbsp; [todo?]</b></p>
      <p>1. The <b>search</b> looks in the name of your tags, categories and transaction-templates. It supports entering just part of the name and even getting some of the letters wrong.<br><code> elct => electricity</code></p>
      <p>2. The <b>amount</b> supports mathematical expressions. Numbers separated by a space get automatically added up.</p>
      <p>3. The <b>description</b> is optional. Use this to overwrite the default tag name.</p>
      <p>4. The <b>todo</b> makes it easy to add the user defined "todo-tag" by appending a custom string(default "!!"). This can be changed in "Settings"</p>
      
      <p><b>Examples</b><br>
      "electricity" = tag<br>
      "swimming" = template <br><br>
      
      <code>
      electricity 23<br> 
      elc 12*2+33<br> 
      elc 12+2*3 custom description<br> 
      elc 25 !!<br>
      swim<br> 
    
      </code>
      </p>
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
