/* Scripts do lançamento da AxiFit · Metodologia GeFit (Jornada da Conversão)
   Regras: sem preço por mensagem, sem "incluso", sem data de fim de lote, confirmação sempre como afirmação. */
const LOTE_FRASE={
  lote1:{curto:'Lote 1',chegou:'Você chegou ainda no Lote 1, a condição mais especial de todo o lançamento, e as vagas dele estão acabando.',dt:'ainda dá tempo de entrar no Lote 1 do lançamento'},
  lote2:{curto:'Lote 2',chegou:'Você chegou no Lote 2 do lançamento, e ainda dá tempo de garantir uma condição especial antes da inauguração.',dt:'ainda dá tempo de entrar no Lote 2 do lançamento'},
  inauguracao:{curto:'Lote de Inauguração',chegou:'Você chegou no Lote de Inauguração, a última chance de entrar com a condição do lançamento.',dt:'ainda dá tempo de entrar no Lote de Inauguração, a última chance do lançamento'}
};
const SCRIPTS=[
  {id:'bv_anuncio',grupo:'1. Boas-vindas',titulo:'Cadastro pelo anúncio ou pela página',quando:'Em até 5 minutos depois que o lead chega.',tipo:'texto',etapas:['novo'],origem:'cadastro',
   t:'Oi, {Nome}! Aqui é {eu}, da AxiFit 😊 Que bom que você garantiu seu presente no lançamento da nova AxiFit! {chegou} Me conta uma coisa: hoje você já treina ou está querendo começar agora?'},
  {id:'bv_whats',grupo:'1. Boas-vindas',titulo:'Chamou direto no WhatsApp',quando:'Assim que a pessoa chamar. Registre o lead em Novo lead.',tipo:'texto',etapas:['novo'],origem:'whatsapp',
   t:'Oi, {Nome}! Aqui é {eu}, da AxiFit 😊 Que bom falar com você! Você chegou num momento muito especial: a AxiFit está de cara nova, com sala de bike, aulas novas e um novo jeito de acompanhar seu treino, e {dt}. Me conta, você já treina ou está pensando em começar agora?'},
  {id:'bv_indicado',grupo:'1. Boas-vindas',titulo:'Indicado por um aluno',quando:'Em até 5 minutos. O card mostra quem indicou.',tipo:'texto',etapas:['novo'],origem:'indicacao',
   t:'Oi, {Nome}! Aqui é {eu}, da AxiFit 😊 {Indicador} separou um presente pra você no lançamento da nova AxiFit, e eu fiquei responsável por te entregar. Me conta, você já treina ou está pensando em começar agora?'},
  {id:'resp',grupo:'2. Depois que a pessoa responde',titulo:'Acolher e puxar para a ligação',quando:'Assim que a pessoa responder. Troque o trecho entre colchetes pelo que ela contou.',tipo:'texto',etapas:['boas_vindas','atendimento'],
   t:'Que legal, {Nome}! [acolha o que a pessoa disse, ex.: "voltar é sempre o passo mais difícil, e você já deu"]. Separei um presente de boas-vindas pra você e quero te explicar rapidinho como funciona o lançamento, porque tem detalhe que muda bastante pro seu caso. Consigo te ligar agora, em 2 minutinhos, ou prefere outro horário?'},
  {id:'audio',grupo:'2. Depois que a pessoa responde',titulo:'Áudio (junto com a mensagem acima)',quando:'Grave com energia, como se falasse só com essa pessoa. Não leia.',tipo:'audio',etapas:['boas_vindas','atendimento'],
   t:'Oi, {Nome}, aqui é {eu}, da AxiFit! Fico muito feliz que você chegou bem no lançamento da nova AxiFit. Separei pra você um presente, um mapeamento completo da sua saúde, e quero te contar rapidinho o que mudou aqui dentro: sala de bike, aulas novas e um acompanhamento que revisa o seu treino a cada 21 dias. Por mensagem fica muito picado, então te ligo em 2 minutinhos. Consigo agora, ou prefere outro horário?'},
  {id:'agenda',grupo:'3. Agendamento',titulo:'Sem resposta à ligação ou quer resolver por mensagem',quando:'Quando não atendeu ou pediu para falar por mensagem. Nunca mande preço.',tipo:'texto',etapas:['boas_vindas','atendimento'],
   t:'{Nome}, aqui no lançamento a gente está atendendo só com horário marcado, porque as vagas do {lote} são limitadas e quero garantir a sua com calma, sem você chegar e ter que esperar. Me fala o melhor período pra eu te ligar rapidinho e já deixar sua visita reservada: manhã, tarde ou noite?'},
  {id:'premio',grupo:'4. Prêmio e indicação',titulo:'Scooter e amigos (para quem já está conversando)',quando:'Depois da conversa iniciada, para levar à visita. Troque as opções de horário.',tipo:'texto',etapas:['atendimento','boas_vindas'],
   t:'Ah, {Nome}, uma coisa que eu não quero que você perca: quem garante o plano anual no lançamento concorre a uma scooter elétrica 🛵 E cada amigo que você trouxer, e que também garantir o anual, vale mais um cupom pra você. Te explico tudo na visita. Fica melhor pra você vir [opção 1] ou [opção 2]?'},
  {id:'confirma',grupo:'5. Confirmação da visita',titulo:'No dia (afirmação, nunca pergunta)',quando:'No dia da visita. Se for de manhã cedo, mande na véspera.',tipo:'texto',etapas:['agendado'],
   t:'Oi, {Nome}! Passando pra lembrar que hoje às [horário] a gente te espera aqui na AxiFit. Já deixei tudo separado pra te mostrar a sala de bike e o seu presente. Chega uns minutinhos antes pra gente tomar um café. Qualquer coisa, me chama aqui. Até já!'},
  {id:'ligacao',grupo:'Roteiro da ligação',titulo:'Conectar, qualificar, pré-ancorar e agendar',quando:'Uso do consultor, não é para enviar.',tipo:'roteiro',etapas:[],
   t:'1. Conectar: agradeça e retome o que a pessoa contou na mensagem. Sorria, fale o nome dela.\n2. Qualificar: entenda o momento ("se você pudesse mudar uma coisa no seu corpo ou na sua saúde, com uma varinha mágica, o que seria?"). Aprofunde cada resposta, não mude de assunto.\n3. Pré-ancorar: conte as novidades (sala de bike, aulas novas, revisão de treino a cada 21 dias, avaliações tecnológicas) e que o lançamento tem uma condição especial por lote. Sem falar preço.\n4. Agendar: "Vou te reservar um horário pra você vir conhecer e a gente já organiza tudo. Fica melhor de manhã ou à tarde?"\n5. Registre a tentativa no Hub e marque o agendamento.'}
];
function scriptTexto(s,ctx){
  const lt=LOTE_FRASE[(ctx&&ctx.lote)||'lote1']||LOTE_FRASE.lote1;
  const nome=(ctx&&ctx.nome)||'[Nome]',eu=(ctx&&ctx.eu)||'[seu nome]',ind=(ctx&&ctx.indicador)||'[Nome de quem indicou]';
  return s.t.replace(/\{Nome\}/g,nome).replace(/\{eu\}/g,eu).replace(/\{Indicador\}/g,ind).replace(/\{chegou\}/g,lt.chegou).replace(/\{dt\}/g,lt.dt).replace(/\{lote\}/g,lt.curto);
}
function scriptsDoLead(l,etapa){
  const orig=l.indicado_por_codigo?'indicacao':(l.origem==='whatsapp'?'whatsapp':'cadastro');
  return SCRIPTS.filter(s=>s.etapas.includes(etapa)&&(!s.origem||s.origem===orig));
}
