# -*- coding: utf-8 -*-
# pylint: disable=C0301
# Having these translations as long lines makes them more readable
INVITATION_EMAIL_TRANSLATIONS = {
    'en': {
        'preheader': 'We\'re thrilled to have you here! Get ready to dive into your new account.',
        'email_header': 'Welcome {first_name},',
        'intro': '''
            We're excited to have you start using {platform_name}.
            First, you need to register your account. Just press the button below.''',
        'btn_text': 'Register Account',
        'on_link_failure_text': 'If that doesn\'t work, copy and paste the following link in your browser:',
        'description_text': '''
            {platform_short_name} is made for decision makers - analysts, data managers, epidemiologists and first responders - who need data to make important decisions.
            In {platform_short_name}, you'll find select data from various siloed systems are made available for rapid analysis and monitoring.''',
        'signoff_text': 'Welcome,',
        'signoff_team': '{platform_name} Support Team',
        'help_question_text': 'Need help registering?',
        'support_text': 'We\'re ready to assist, email us at {support_email}',
    },
    'fr': {
        'preheader': 'Nous sommes ravis que vous nous rejoigniez! Préparez-vous à utiliser votre nouveau compte.',
        'email_header': 'Bienvenue {first_name},',
        'intro': '''
            Nous sommes ravis de vous accueillir sur {platform_name}. Tout d'abord, vous devez enregistrer votre compte.
            Appuyez simplement sur le bouton ci-dessous.''',
        'btn_text': 'Créer un compte',
        'on_link_failure_text': 'Si cela ne fonctionne pas, copiez et collez le lien suivant dans votre navigateur:',
        'description_text': '''
            {platform_name} est destinée aux décideurs (analystes, gestionnaires de données, épidémiologistes et premiers intervenants) qui ont besoin de données pour prendre leurs décisions importantes.
            Dans {platform_name}, vous trouverez des données provenant de divers systèmes, mises à disposition pour une analyse et une surveillance rapide''',
        'signoff_text': 'Bienvenue,',
        'signoff_team': 'l’Equipe de Support {platform_name}',
        'help_question_text': 'Besoin d\'aide?',
        'support_text': 'Nous sommes prêts à aider, rejoignez-nous à {support_email}',
    },
    'br': {
        'preheader': 'Estamos entusiasmados por ter você aqui! Prepare-se para mergulhar na sua nova conta.',
        'email_header': 'Seja bem-vindo {first_name},',
        'intro': '''
        Estamos felizes em ter você na nossa Plataforma {platform_name}.
        Primeiramente, você precisa fazer o registro da sua conta, para isso, basta clicar no botão abaixo:''',
        'btn_text': 'Registrar Conta',
        'on_link_failure_text': 'Se isso não funcionar, copie e cole o seguinte link no seu navegador:',
        'description_text': '''
            A Plataforma {platform_name} foi feita para todos, analistas, gestores e epidemiologistas que precisam analisar dados para tomar decisões importantes.
            Na Plataforma, você encontrará dados selecionados de alguns sistemas que compõem o SUS para monitoramento e análise.
            Se você ainda não sabe utilizar a plataforma, por favor acesse o link abaixo contendo o manual e os vídeos instrutivos:
http://plataforma.saude.gov.br/materiais-instrutivos-IVIS-analitico/''',
        'signoff_text': 'Faça um bom uso da nossa Plataforma,',
        'signoff_team': 'Equipe de Suporte DAENT SVSA/MS.',
        'help_question_text': 'Precisa de ajuda para se registrar?',
        'support_text': 'Estamos prontos para ajudar, envie a sua questão para {support_email}',
    },
}

PASSWORD_RESET_TRANSLATIONS = {
    'en': {
        'preheader': 'You requested password reset',
        'email_header': 'Hi {first_name},',
        'intro': 'Someone recently requested a password change for your {platform_name}. If this was you, you can set a new password here:',
        'btn_text': 'Reset Password',
        'reassuring_statement': 'If you don\'t want to change your password or didn\'t request this, just ignore and delete this message',
        'on_link_failure_text': 'If that doesn\'t work, copy and paste the following link in your browser:',
        'expiration_text': 'This link will expire in {expiration_days} days.',
        'help_question_text': 'Need help?',
        'support_text': 'We\'re ready to assist, email us at {support_email}',
        'signoff_text': 'Thank you,',
        'signoff_team': '{platform_name} Support Team',
        'donot_reply': 'Do not reply to this message',
    },
    'fr': {
        'preheader': 'Vous avez demandé la réinitialisation du mot de passe',
        'email_header': 'Salut {first_name},',
        'intro': 'Quelqu\'un a récemment demandé un changement de mot de passe pour votre {platform_name}. Si c\'était votre cas, vous pouvez définir un nouveau mot de passe ici:',
        'btn_text': 'Réinitialiser le mot de passe',
        'reassuring_statement': 'Si vous ne voulez pas changer votre mot de passe ou si vous ne l\'avez pas demandé, ignorez et supprimez ce message',
        'on_link_failure_text': 'Si cela ne fonctionne pas, copiez et collez le lien suivant dans votre navigateur:',
        'expiration_text': 'Ce lien expirera dans {expiration_days} jours',
        'help_question_text': 'Besoin d\'aide?',
        'support_text': 'Nous sommes prêts à aider, rejoignez-nous à {support_email}',
        'signoff_text': 'Bienvenue,',
        'signoff_team': 'l’Equipe de Support {platform_name}',
        'donot_reply': 'Ne répond pas a ce message',
    },
    'br': {
        'preheader': 'Você solicitou redefinição de senha',
        'email_header': 'Olá {first_name},',
        'intro': 'Alguém solicitou recentemente uma mudança de senha para seu acesso à plataforma {platform_name}. Se foi você, você pode definir uma nova senha aqui:',
        'btn_text': 'Redefinir senha',
        'reassuring_statement': 'Se você não quiser mudar sua senha ou se não solicitou isto, simplesmente ignore e apague esta mensagem.',
        'on_link_failure_text': 'Se isso não funcionar, copie e cole o seguinte link em seu navegador:',
        'expiration_text': 'Este link expirará em {expiration_days} dias.',
        'help_question_text': 'Precisa de ajuda??',
        'support_text': 'Se precisar de ajuda, é só nos enviar um e-mail {support_email}',
        'signoff_text': 'Obrigado,',
        'signoff_team': 'Equipe de suporte {platform_name}',
        'donot_reply': 'Não responda a esta mensagem',
    },
}


ALERT_EMAIL_TRANSLATIONS = {
    'br': {
        'preheader': 'Você tem novos alertas! Aqui está o seu resume diário',
        'email_header': 'Olá!',
        'intro': 'Novos alertas foram gerados',
        'btn_text': 'Ver Alertas',
        'on_link_failure_text': 'Se isto não funcionar, copie e cole este link:',
        'description_text': 'Novos Alertas',
        'title_td': 'Titulo',
        'geography_td': 'Localidades Afetadas',
        'previous_alert_txt': 'Alertas do dia anterior',
        'no_alert_text': ' Nenhum outro alerta hoje',
        'signoff_text': 'Muito obrigado,',
        'signoff_team': 'Equipe de suported da {platform_name}',
        'help_question_text': 'Preciso de ajuda?',
        'support_text': 'Estamos prontos para ajudar, envie um email para {support_email}',
        'donot_reply': 'Não responda a esta mensagem',
    },
    'en': {
        'preheader': 'You have new alert notifications! Here is your daily summary.',
        'email_header': 'Hello!',
        'intro': 'New alerts have been generated',
        'btn_text': 'View Alerts',
        'on_link_failure_text': 'If that doesn\'t work, copy and paste the following link:',
        'description_text': 'New Alerts:',
        'title_td': 'Title',
        'geography_td': 'Triggered Geographies',
        'previous_alert_txt': 'Previous alerts from today:',
        'no_alert_text': 'No other alerts today',
        'signoff_text': 'Thank you,',
        'signoff_team': '{platform_name} Support Team',
        'help_question_text': 'Need help?',
        'support_text': 'We\'re ready to assist, email us at {support_email}',
        'donot_reply': 'Do not reply to this message',
    },
}

ACCESS_GRANTED_EMAIL_TRANSLATIONS = {
    'en': {
        'preheader': 'You have been granted access! Get ready to dive into your new dashboard.',
        'email_header': 'Hello,',
        'intro': 'You have been given {granted_permissions} access to the dashboard {dashboard_name} by {dashboard_owner}. Just click the button below to view it.',
        'btn_text': 'Visit dashboard',
        'on_link_failure_text': 'If that doesn\'t work, copy and paste the following link in your browser:',
        'signoff_text': 'Thank you,',
        'signoff_team': '{platform_name} Support Team',
        'help_question_text': 'Need help?',
        'support_text': 'We\'re ready to assist, email us at {support_email}',
        'donot_reply': 'Do not reply to this message',
    }
}

NEW_DASHBOARD_EMAIL_TRANSLATIONS = {
    'en': {
        'preheader': 'Get ready to dive into your new dashboard!',
        'email_header': 'Hello {first_name},',
        'intro': 'You have created a new dashboard, {dashboard_name}. Click the button below to view it.',
        'btn_text': 'Visit dashboard',
        'on_link_failure_text': 'If that doesn\'t work, copy and paste the following link in your browser:',
        'signoff_text': 'Thank you,',
        'signoff_team': '{platform_name} Support Team',
        'help_question_text': 'Need help?',
        'support_text': 'We\'re ready to assist, email us at {support_email}',
        'donot_reply': 'Do not reply to this message',
    }
}

SHARE_ANALYSIS_EMAIL_TRANSLATIONS = {
    'en': {
        'btn_text': 'ACCESS QUERY',
        'help_question_text': 'Need help?',
        'support_text': 'We\'re ready to assist, email us at {support_email}',
    },
    'br': {
        'btn_text': 'Acesse a Análise',
        'help_question_text': 'Precisa de ajuda?',
        'support_text': 'Se precisar de ajuda, é só nos enviar um e-mail {support_email}',
    },
}

SHARE_DASHBOARD_EMAIL_TRANSLATIONS = {
    'en': {
        'btn_text': 'ACCESS DASHBOARD',
        'help_question_text': 'Need help?',
        'support_text': 'We\'re ready to assist, email us at {support_email}',
    },
    'br': {
        'btn_text': 'Acesse o Painel',
        'help_question_text': 'Precisa de ajuda?',
        'support_text': 'Se precisar de ajuda, é só nos enviar um e-mail {support_email}',
    },
}
