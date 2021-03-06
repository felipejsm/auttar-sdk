/*
 * @Author: Alexandre Clayton Vaz Sette (alexandreclayton@gmail.com)
 * @Lib: AuttarSDK
 * @Date: 21/08/2017
 * 
 * Copyright 2017 Alexandre Clayton Vaz Sette
 * Licensed under the Apache License, Version 2.0 (the “License”);
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an “AS IS” BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 */

var AuttarSDK = (function () {

    var _url = "";
    var _ws = null;
    var _aOperacoes = [];
    var _close = true;
    let _timeoutConn = null;

    function AuttarSDK(p_url = "ws://localhost:2500") {
        _aOperacoes[6] = {operacao: 6}; // Confirmação
        _aOperacoes[101] = {operacao: 101, valorTransacao: 0}; // Débito
        _aOperacoes[106] = {operacao: 106, valorTransacao: 0}; // Voucher
        _aOperacoes[112] = {operacao: 112, valorTransacao: 0}; // Crédito A Vista
        _aOperacoes[113] = {operacao: 113, valorTransacao: 0, numeroParcelas: 0}; // Crédito Parcelado Lojista (sem juros)
        _aOperacoes[114] = {operacao: 114, valorTransacao: 0, numeroParcelas: 0}; // Crédito Parcelado Administradora (com juros)
        _aOperacoes[128] = {operacao: 128, valorTransacao: 0, dataTransacao: "", nsuCTF: ""}; // Cancelamento
        _aOperacoes[191] = {operacao: 191}; // Desfazimento Total
        // Bind
        _url = p_url;
        _connect.bind(this);
        _disconnect.bind(this);
        _timeout.bind(this);
        _clearTimeout.bind(this);
    }

    function _connect(p_oOperacao) {
        return new Promise((resolve, reject) => {
            /*
             CONNECTING	0 A conexão ainda não está aberta.
             OPEN	1 A conexão está aberta e pronta para se comunicar.
             CLOSING	2 A conexão está em processo de fechamento.
             CLOSED	3 A conexão está fechada ou não foi possível abrir.
             */
            if (_ws === null) {
                _ws = new WebSocket(_url);
            } else {
                if (_ws.readyState === 2 || _ws.readyState === 3) {
                    _disconnect();
                    try {
                        _ws = new WebSocket(_url);
                    } catch (e) {
                        reject(e);
                    }
                }
            }

            _timeout();

            _ws.onopen = function (evt) {
                _clearTimeout();
                _ws.send(JSON.stringify(p_oOperacao));
                _timeout(60000);
            };
            
            _ws.onmessage = function (evtMsg) {
                _clearTimeout();
                resolve(evtMsg);
            };
            
            _ws.onerror = function (evtError) {
                _clearTimeout();
                reject(evtError);
            };
            
            _ws.onclose = function (evtClose) {
                _clearTimeout();
                reject(evtClose);
            };
            
        });
    }

    function _disconnect() {
        _ws.close();
    }

    function _timeout(p_time = 10000) {
        _close = true;
        _timeoutConn = setTimeout(function () {
            console.log("setTimeout", _close);
            if (_close) {
                _ws.close();
            } else {
                _clearTimeout();
            }
        }, p_time);
    }

    function _clearTimeout() {
        _close = false;
        clearTimeout(_timeoutConn);
    }

    /*
     * Operações financeiras
     */

    /*
     * 
     * @param {int} p_valor Ex: 1000 (R$ 10,00)
     * @param {type} p_nOper
     * @returns {Json}
     */
    AuttarSDK.prototype.Debito = function (p_valor, p_nOper = 101) {
        const operacao = _aOperacoes[p_nOper];
        operacao.valorTransacao = p_valor;
        return _connect(operacao);
    };
    /*
     * 
     * @param {int} p_valor Ex: 1000 (R$ 10,00)
     * @param {type} p_nOper
     * @returns {Json}
     */
    AuttarSDK.prototype.Voucher = function (p_valor, p_nOper = 106) {
        const operacao = _aOperacoes[p_nOper];
        operacao.valorTransacao = p_valor;
        return _connect(operacao);
    };
    /*
     * 
     * @param {int} p_valor Ex: 1000 (R$ 10,00)
     * @param {type} p_nOper
     * @returns {Json}
     */
    AuttarSDK.prototype.CreditoAVista = function (p_valor, p_nOper = 112) {
        const operacao = _aOperacoes[p_nOper];
        operacao.valorTransacao = p_valor;
        return _connect(operacao);
    };
    /**
     * 
     * @param {int} p_valor Ex: 1000 (R$ 10,00)
     * @param {int} p_parcelas Ex: 2
     * @param {int} p_nOper 
     * @returns {Json}
     */
    AuttarSDK.prototype.CreditoParceladoLojista = function (p_valor, p_parcelas, p_nOper = 113) {
        const operacao = _aOperacoes[p_nOper];
        operacao.valorTransacao = p_valor;
        operacao.numeroParcelas = p_parcelas;
        return _connect(operacao);
    };
    /**
     * 
     * @param {int} p_valor Ex: 1000 (R$ 10,00)
     * @param {int} p_parcelas Ex: 2
     * @param {int} p_nOper 
     * @returns {Json}
     */
    AuttarSDK.prototype.CreditoParceladoAdm = function (p_valor, p_parcelas, p_nOper = 114) {
        const operacao = _aOperacoes[p_nOper];
        operacao.valorTransacao = p_valor;
        operacao.numeroParcelas = p_parcelas;
        return _connect(operacao);
    };

    /*
     * Operações de controle
     */
    AuttarSDK.prototype.ConfirmaOperacao = function (p_nOper = 6) {
        const operacao = _aOperacoes[p_nOper];
        return _connect(operacao);
    };

    AuttarSDK.prototype.DesfazimentoTotal = function (p_nOper = 191) {
        const operacao = _aOperacoes[p_nOper];
        return _connect(operacao);
    };

    /*
     * Cancelamento
     */
    /**
     * 
     * @param {int} p_valor Ex: 1000 (R$ 10,00)
     * @param {String} p_dataTransacao Ex: 210817
     * @param {int} p_nsuCTF Ex: 37384
     * @param {int} p_nOper
     * @returns {Json}
     */
    AuttarSDK.prototype.Cancelamento = function (p_valor, p_dataTransacao, p_nsuCTF, p_nOper = 128) {
        const operacao = _aOperacoes[p_nOper];
        operacao.valorTransacao = p_valor;
        operacao.dataTransacao = p_dataTransacao;
        operacao.nsuCTF = p_nsuCTF;
        return _connect(operacao);
    };

    return AuttarSDK;
}());
