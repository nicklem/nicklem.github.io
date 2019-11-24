function crea_contenitori(id, tipo) {
    let template = `
<span class="cifra">
    <span class="cifra-inner" id="cifra-inner-###-***">
        <span class="cifra-a" id="cifra-###-***a">0</span>
        <span class="cifra-b" id="cifra-###-***b">0</span>
    </span>
</span>
`;
    let html = '';
    for(let i = 0; i < 8; i++) {
        html += template
            .replace(/\*\*\*/g, i)
            .replace(/###/g, tipo);
    }
    document.getElementById(id).innerHTML = html;
}

function anima(idx, n, tipo) {
    const n0 = document.getElementById('cifra-' + tipo + '-' + idx + 'a');
    const n1 = document.getElementById('cifra-' + tipo + '-' + idx + 'b');
    const c = document.getElementById('cifra-inner-' + tipo + '-' + idx);
    c.classList.add('anima');
    n0.innerText = n;
    setTimeout(function() {
        n1.innerText = n;
        c.classList.remove('anima');
    }, 980);
}

String.prototype.lpad = function(padString, length) {
    var str = this;
    while (str.length < length)
        str = padString + str;
    return str;
};

function dec2dec(dec){
    return (dec >>> 0).toString(10).lpad('0', 8).split('').slice(-8);
}

function dec2bin(dec){
    return (dec >>> 0).toString(2).lpad('0', 8).split('').slice(-8);
}

function dec2hex(dec){
    return (dec >>> 0).toString(16).lpad('0', 8).split('').slice(-8);
}

let n = 1;
let bin = '00000000'.split('');
let dec = '00000000'.split('');
let hex = '00000000'.split('');
let pause = false;

document.getElementById('pause').addEventListener('click', function (el) {
    pause = !pause;
    if(pause) {
       this.classList.add('pause');
    } else {
       this.classList.remove('pause');
    }
});

document.getElementById('reset').addEventListener('click', function () {
    n = 0;
});

function step() {
    if(!pause) {
        let dec_new = dec2dec(n);
        for(let i = 0, l = bin.length; i < l; i++) {
            if(dec_new[i] !== dec[i]) {
                anima(i, dec_new[i], 'd');
                dec[i] = dec_new[i];
            }
        }

        let bin_new = dec2bin(n);
        for(let i = 0, l = bin.length; i < l; i++) {
            if(bin_new[i] !== bin[i]) {
                anima(i, bin_new[i], 'b');
                bin[i] = bin_new[i];
            }
        }

        // let hex_new = dec2hex(n);
        // for(let i = 0, l = bin.length; i < l; i++) {
        //     if(hex_new[i] !== hex[i]) {
        //         anima(i, hex_new[i], 'h');
        //         hex[i] = hex_new[i];
        //     }
        // }

        n++;
    }
}

crea_contenitori('contatore-decimale', 'd');
crea_contenitori('contatore-binario', 'b');
// crea_contenitori('contatore-esadecimale', 'h');

step();

setInterval(step, 1000);
