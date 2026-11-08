-- OPTIONAL sample content (all titles start with SAMPLE). Run it only to see how pages look,
-- then delete the rows from the staff portal before launch.
insert into public.jobs (slug, title_en, title_fr, department, location, employment_type, experience_level, summary_en, summary_fr, description_en, description_fr, requirements_en, requirements_fr, closing_date, status)
values
  ('network-systems-engineer', 'SAMPLE: Network & Systems Engineer', 'EXEMPLE : Ingénieur réseaux et systèmes', 'Engineering', 'Kigali, Rwanda', 'full-time', 'mid', 'Design, deploy and support enterprise networks and server environments for Qartexa clients.', 'Concevoir, déployer et soutenir les réseaux et serveurs d’entreprise des clients de Qartexa.', '## About the role
You will work with our delivery team to plan and implement enterprise networking, server and storage projects across Rwanda and the region.

## Responsibilities
- Design and configure LAN, WAN and wireless networks
- Install and maintain servers and virtualization platforms
- Prepare technical documentation and hand-over reports
- Support clients during and after go-live', '## Le poste
Vous travaillerez avec notre équipe de livraison pour planifier et mettre en œuvre des projets de réseaux, serveurs et stockage au Rwanda et dans la région.

## Responsabilités
- Concevoir et configurer des réseaux LAN, WAN et sans fil
- Installer et maintenir serveurs et plateformes de virtualisation
- Rédiger la documentation technique et les rapports de remise
- Accompagner les clients pendant et après la mise en service', '- Degree in ICT, networking or a related field
- 3+ years of hands-on experience
- Industry certifications are an advantage
- Strong communication in English; French is a plus', '- Diplôme en TIC, réseaux ou domaine connexe
- 3 ans ou plus d’expérience pratique
- Les certifications du secteur sont un atout
- Bonne communication en anglais ; le français est un plus', '2026-12-17', 'open'),
  ('cybersecurity-analyst', 'SAMPLE: Cybersecurity Analyst', 'EXEMPLE : Analyste en cybersécurité', 'Security', 'Kigali, Rwanda', 'full-time', 'senior', 'Assess risks, monitor threats and strengthen the security posture of client environments.', 'Évaluer les risques, surveiller les menaces et renforcer la sécurité des environnements clients.', '## About the role
Join our security practice to assess client environments, recommend improvements and support incident response.

## Responsibilities
- Run security assessments and vulnerability reviews
- Monitor alerts and advise on remediation
- Help clients align with good-practice frameworks', '## Le poste
Rejoignez notre pratique sécurité pour évaluer les environnements clients, recommander des améliorations et soutenir la réponse aux incidents.

## Responsabilités
- Réaliser des évaluations de sécurité et des revues de vulnérabilités
- Surveiller les alertes et conseiller sur la remédiation
- Aider les clients à s’aligner sur les référentiels de bonnes pratiques', '- 5+ years in information security
- Experience with SIEM and vulnerability tools
- Relevant certification (e.g. CISSP, CEH) preferred', '- 5 ans ou plus en sécurité de l’information
- Expérience des outils SIEM et de gestion des vulnérabilités
- Certification pertinente (ex. CISSP, CEH) appréciée', '2026-12-02', 'open'),
  ('internship-ict-support', 'SAMPLE: ICT Support Intern', 'EXEMPLE : Stagiaire support TIC', 'Managed Services', 'Kigali, Rwanda', 'internship', 'entry', 'A six-month placement supporting our service desk and field engineers.', 'Un stage de six mois auprès de notre centre de services et de nos ingénieurs terrain.', '## About the role
Gain practical experience supporting real client environments alongside experienced engineers.', '## Le poste
Acquérez une expérience pratique auprès d’ingénieurs expérimentés sur de vrais environnements clients.', '- Final-year student or recent graduate in ICT
- Eager to learn and work in a team', '- Étudiant en dernière année ou jeune diplômé en TIC
- Motivé pour apprendre et travailler en équipe', '2027-01-01', 'open')
on conflict (slug) do nothing;
insert into public.posts (slug, title_en, title_fr, excerpt_en, excerpt_fr, category, author, status, published_at, body_en, body_fr)
values
  ('sample-planning-resilient-network', 'SAMPLE: Five questions to ask before upgrading your network', 'EXEMPLE : Cinq questions à poser avant de moderniser votre réseau', 'A short checklist to help organisations plan a resilient, secure and scalable network upgrade.', 'Une courte liste de contrôle pour planifier une modernisation de réseau résiliente, sécurisée et évolutive.', 'Infrastructure', 'Qartexa Technologies', 'published', '2026-10-23', 'A network upgrade is more than new hardware. Before you start, ask:

1. **What must never go offline?** List the services your operations depend on.
2. **Where are the weak points?** Look for single points of failure.
3. **How will it be secured?** Plan access control and monitoring from day one.
4. **Who will run it?** Decide on in-house or managed support.
5. **How will it grow?** Leave room for the next three to five years.

> Good planning is the cheapest part of any project.

Talk to our team if you would like a second opinion on your plan.', 'Moderniser un réseau ne se limite pas à du nouveau matériel. Avant de commencer, posez-vous ces questions :

1. **Qu’est-ce qui ne doit jamais s’arrêter ?** Listez les services dont vos opérations dépendent.
2. **Où sont les points faibles ?** Repérez les points de défaillance uniques.
3. **Comment sera-t-il sécurisé ?** Prévoyez contrôle d’accès et supervision dès le départ.
4. **Qui l’exploitera ?** Choisissez entre support interne ou géré.
5. **Comment évoluera-t-il ?** Prévoyez les trois à cinq prochaines années.

> Une bonne planification est la partie la moins coûteuse de tout projet.

Contactez notre équipe pour un second avis sur votre plan.'),
  ('sample-cyber-basics', 'SAMPLE: Cybersecurity basics every organisation should have', 'EXEMPLE : Les bases de cybersécurité que toute organisation devrait avoir', 'Practical first steps that reduce risk without a large budget.', 'Des premières mesures pratiques qui réduisent le risque sans gros budget.', 'Security', 'Qartexa Technologies', 'published', '2026-10-09', 'Most incidents start with simple gaps. Start with these basics:

- Multi-factor authentication on all key accounts
- Regular, tested backups kept offline
- Prompt software updates
- Staff awareness training
- A written incident response plan', 'La plupart des incidents commencent par de simples failles. Commencez par ces bases :

- Authentification multifacteur sur les comptes clés
- Sauvegardes régulières, testées et conservées hors ligne
- Mises à jour logicielles rapides
- Sensibilisation du personnel
- Un plan écrit de réponse aux incidents')
on conflict (slug) do nothing;
insert into public.tenders (slug, reference, title_en, title_fr, description_en, description_fr, category, issued_date, closing_date, status, contact_email)
values
  ('sample-tender-network-supply', 'QTX-T-SAMPLE-001', 'SAMPLE: Supply and installation of structured cabling', 'EXEMPLE : Fourniture et installation de câblage structuré', 'This is a **sample** tender notice showing how opportunities appear on the website.

## Scope
- Supply of cabling materials
- Installation and testing
- Documentation', 'Ceci est un avis d’appel d’offres **exemple** montrant l’affichage des opportunités sur le site.

## Périmètre
- Fourniture des matériaux de câblage
- Installation et tests
- Documentation', 'Goods and services', '2026-10-26', '2026-11-23', 'open', 'qartexa@gmail.com'),
  ('sample-tender-closed', 'QTX-T-SAMPLE-000', 'SAMPLE: Annual hardware maintenance services', 'EXEMPLE : Services annuels de maintenance matérielle', 'A closed sample tender.', 'Un appel d’offres exemple clôturé.', 'Services', '2026-09-03', '2026-10-13', 'closed', 'qartexa@gmail.com')
on conflict (slug) do nothing;
