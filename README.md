# Deepselect
Pure javascript library for easy handling continous option subselecting

## Requirements
PHP >= 5.4
- gd


## Usage

```html
<!DOCTYPE HTML>
<html>
    <head>
        <script type="text/javascript" src="../src/deepselect.js"></script>
        <script type="text/javascript">
            document.addEventListener("DOMContentLoaded", function() {
                var dsel = deepselect({
                    enableLabels: true,
                    label: "Choose your destiny...",
                    labelSelectable: true,
                    labelValue: "none",
                    data: { items: [
                        { name: "SubZero", value: "uid-SubZero", labelValue: "selectMe", labelSelectable:false,items: [
                            { name: "Reptilian", value: "uid-Reptilian", items: [
                                { name: "Sector", value: "uid-Sector" },
                                { name: "Syrax", value: "uid-Syrax" },
                                { name: "Smoke", value: "uid-Smoke" }
                            ]},
                            { name: "Scorpion", value: "uid-Scorpion" },
                            { name: "Ermak", value: "key-Ermak" }
                        ]},
                        { name: "Kane", value: "uid-Kane" },
                        { name: "Motaro", value: "uid-Motaro" }
                    ]}
                });
                
                dsel.onSelect(function( e ) {
                    console.log("onSelect()", e);
                    console.log(this.isCompleted(), this.currentValues());
                });
                
                dsel.onSelectStart(function( e ) {
                    console.log("onSelectStart()", e);
                    console.log(this.isCompleted(), this.currentValues());
                });
                
                dsel.onSelectComplete(function( e ) {
                    console.log("onSelectComplete()", e);
                    console.log(this.isCompleted(), this.currentValues());
                });
                
                
            //	dsel.currentIndexes([0,1,2]);
                dsel.currentValues(["uid-SubZero", "uid-Reptilian", "uid-Smoke"]);
                
                
                document.getElementById("myContainer").appendChild(dsel);
            });
        </script>
    </head>
    <body>
        <div id="myContainer"></div>
    </body>
</html>
```
