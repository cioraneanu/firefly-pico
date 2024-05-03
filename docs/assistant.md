## Transaction assistant

Easily turn words into a transaction. You can even use phone's dictation if you're hands are busy.

Expected format: ```[Tag / category / template] [amount?] [description?]"```


 - All words until the first numerical value is the search phrase. This phrase is searched in your tags, categories and transaction-templates. It supports entering just part of the name and even getting some of the letters wrong (aka fuzzy search)
Templates have a slightly higher weight in results.


- The "amount" part can be a single or multiple numbers. If there are multiple numbers they automatically get added up
`Ex. electr 20 10 1` => `electricity 31`
It alo supports mathematical expressions (just make sure to not use spaces): `Ex. 100/4+24*7`.
<br> This field is optional. If you have a "template", that has the amount set, you can omit this and only write the 
template name. Specifying it will however overwrite the template value.


- The "description" is the phrase found after the numerical part. It is also optional and will also overwrite any
"template" description if one is provided. 

<h3>Summary</h3>

```
template 23
templ 12 22 33
tmplat 12+2*3
tmplat 12+2*3 custom description
```