## Transaction assistant

Easily turn words into a transaction. You can even use phone's dictation for a hands free experience :loudspeaker:

Expected format: ```[Tag / category / template] [amount?] [description?]"```


 - All _words_ until the first numerical value is the "**search phrase**". This phrase is searched in your list  of Tags, Categories and Templates. It supports entering just part of the name and even getting some of the letters wrong (fuzzy search).
If multiple matches are found the priority is `Templates > Tags > Categories`.


- The "**amount**" part can be a single or multiple numbers. Multiple numbers separated by a space get automatically added up
`Ex. electr 20 10 1` => `electricity 31`
This field supports decimal values and mathematical expressions (just make sure to not use spaces): `Ex. 100/4+24.5*6`.
<br> This field is optional. If you have a Template, that has the amount set, you can omit this and only write the 
template name. Specifying it overwrite the Template amount.


- The "description" is the phrase found after the numerical part. It is also optional and will also overwrite any
Template description if one is provided. 

<h3>Summary</h3>

```
template 23
templ 12 22 33
tmplat 12+2*3
tmplat 12+2*3 custom description
```