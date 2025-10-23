## Transaction assistant

Easily turn words into a transaction. You can even use phone's dictation for a hands free experience :loudspeaker:

### Format
`[Tag / category / template] [amount?] [description?] [todo?]`

1. The <b>search</b> looks in the name of your tags, categories and transaction-templates. It supports entering just part of the name and even getting some of the letters wrong.<br><code> elct => electricity</code>
2. The <b>amount</b> supports mathematical expressions. Numbers separated by a space get automatically added up.</p>
3. The <b>description</b> is optional. Using this will overwrite the default value (tag name / template description).</p>
4. The <b>todo</b> makes it easy to add your custom "todo-tag" by appending a custom string (default "!!"). This can be changed in "Settings"</p>
      
### Examples
"electricity" = tag<br>
"swimming" = template <br><br>

```
electricity 23 
elc 12*2+33 
elc 12+2*3 custom description 
elc 25 !!
swim
```