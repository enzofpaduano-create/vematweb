export interface MecalacOfficialDetailSection {
  title: string | null;
  body: string | null;
  bullets: string[];
}

export interface MecalacOfficialContentItem {
  sourceUrl?: string | null;
  descriptionFr?: string | null;
  images?: Array<{ path: string }>;
  detailSections?: MecalacOfficialDetailSection[];
  accessories?: string[];
  downloads?: Array<{ label: string | null; url: string }>;
}

export const mecalacOfficialContent: Record<string, MecalacOfficialContentItem> = {
  "mcl2": {
    "sourceUrl": "https://mecalac.com/fr/machine/mcl2.html",
    "descriptionFr": "Son petit gabarit et sa transmission à moteurs roues lui permet d'évoluer avec agilité sur tous les terrains. Plus petite chargeuse de la gamme MCL mais dotée de performances maximales, elle possède toutes les caractéristiques des grandes. Son poste de conduite moderne et ergonomique, protégé par un canopy, est également disponible en version cabine.",
    "images": [
      {
        "path": "/images/products/mcl2/01-39f675056c16.png"
      },
      {
        "path": "/images/products/mcl2/02-e27ea927ae29.png"
      },
      {
        "path": "/images/products/mcl2/03-f042a968ead5.png"
      },
      {
        "path": "/images/products/mcl2/04-ddff93bcd3f3.png"
      },
      {
        "path": "/images/products/mcl2/05-d92714c603b7.png"
      },
      {
        "path": "/images/products/mcl2/06-a2a1b1ae9805.png"
      },
      {
        "path": "/images/products/mcl2/07-86fa35b08780.png"
      },
      {
        "path": "/images/products/mcl2/08-cfc80c8eaa55.jpg"
      },
      {
        "path": "/images/products/mcl2/09-d7a54e5d15c9.jpg"
      },
      {
        "path": "/images/products/mcl2/10-a38bca94de28.jpg"
      },
      {
        "path": "/images/products/mcl2/11-b6e3baa22f8a.jpg"
      },
      {
        "path": "/images/products/mcl2/12-bc251fe1f0e9.jpg"
      },
      {
        "path": "/images/products/mcl2/13-d0acb77d0039.jpg"
      },
      {
        "path": "/images/products/mcl2/14-0b4e1c483bf4.jpg"
      },
      {
        "path": "/images/products/mcl2/15-7be7cd6e0059.jpg"
      },
      {
        "path": "/images/products/mcl2/16-252a3f918ff4.jpg"
      },
      {
        "path": "/images/products/mcl2/17-04270043904e.jpg"
      },
      {
        "path": "/images/products/mcl2/18-61469ec1023c.jpg"
      },
      {
        "path": "/images/products/mcl2/19-cb1c8cee52af.svg"
      }
    ],
    "detailSections": [],
    "accessories": [],
    "downloads": [
      {
        "label": "Télécharger",
        "url": "https://mecalac.com/fr/api_download/11005/MECALAC-Leaflet-MCL_SERIES-MCL-MK455-FR-web.pdf"
      },
      {
        "label": "Leaflet : MCL SERIES",
        "url": "https://mecalac.com/fr/api_download/11005/MECALAC-Leaflet-MCL_SERIES-MCL-MK455-FR-web.pdf"
      }
    ]
  },
  "mcl4": {
    "sourceUrl": "https://mecalac.com/fr/machine/mcl4plus.html",
    "descriptionFr": "Elle offre un excellent compromis entre compacité et performances de levage. Avec son moteur de 18.4 kW, c’est aussi la machine idéale pour les parcs de location qui souhaitent une machine performante et durable. Son poids de transport réduit permet de transporter la machine sur une remorque routière. Cette version bras court est parfaite pour répondre aux besoins particuliers des différentes applications notamment pour le secteur de la construction en offrant une charge de basculement accrue.",
    "images": [
      {
        "path": "/images/products/mcl4/01-8221dd08651c.png"
      },
      {
        "path": "/images/products/mcl4/02-36898833f7bd.png"
      },
      {
        "path": "/images/products/mcl4/03-3f9bf1d8d046.png"
      },
      {
        "path": "/images/products/mcl4/04-11d77bda0098.png"
      },
      {
        "path": "/images/products/mcl4/05-358ecf3b74d4.png"
      },
      {
        "path": "/images/products/mcl4/06-bbfcc2352532.png"
      },
      {
        "path": "/images/products/mcl4/07-080824622bae.png"
      },
      {
        "path": "/images/products/mcl4/08-97526b92ce8d.png"
      },
      {
        "path": "/images/products/mcl4/09-fec017759ccd.png"
      },
      {
        "path": "/images/products/mcl4/10-c7a34c9e1d45.png"
      },
      {
        "path": "/images/products/mcl4/11-64b4cd220892.svg"
      }
    ],
    "detailSections": [],
    "accessories": [],
    "downloads": [
      {
        "label": "Télécharger",
        "url": "https://mecalac.com/fr/api_download/11005/MECALAC-Leaflet-MCL_SERIES-MCL-MK455-FR-web.pdf"
      },
      {
        "label": "Leaflet : MCL SERIES",
        "url": "https://mecalac.com/fr/api_download/11005/MECALAC-Leaflet-MCL_SERIES-MCL-MK455-FR-web.pdf"
      }
    ]
  },
  "mcl6": {
    "sourceUrl": "https://mecalac.com/fr/machine/mcl6plus.html",
    "descriptionFr": "Le meilleur de la MCL4 mais avec encore plus de puissance, son moteur de 36kW lui permet notamment d'atteindre des vitesses élevées sur route. Son haut débit hydraulique et sa rapidité d'exécution permettent d'augmenter considérablement la productivité sur les chantiers. Des versions bras courts pour répondre aux besoins particuliers des différentes applications notamment pour le secteur de la construction en offrant une charge de basculement accrue.",
    "images": [
      {
        "path": "/images/products/mcl6/01-b3ad84451333.png"
      },
      {
        "path": "/images/products/mcl6/02-d284eb4222a0.png"
      },
      {
        "path": "/images/products/mcl6/03-9fbe794a88e3.svg"
      }
    ],
    "detailSections": [],
    "accessories": [],
    "downloads": [
      {
        "label": "Télécharger",
        "url": "https://mecalac.com/fr/api_download/11005/MECALAC-Leaflet-MCL_SERIES-MCL-MK455-FR-web.pdf"
      },
      {
        "label": "Leaflet : MCL SERIES",
        "url": "https://mecalac.com/fr/api_download/11005/MECALAC-Leaflet-MCL_SERIES-MCL-MK455-FR-web.pdf"
      }
    ]
  },
  "mcl8": {
    "sourceUrl": "https://mecalac.com/fr/machine/mcl8.html",
    "descriptionFr": "Puissance, grande hauteur de déversement et capacité de levage sont les maitres mots qui ont guidées la conception de cette machine. Elle est à l'aise dans toutes les circonstances que ce soit pour charger, manutentionner ou entrainer des accessoires hydrauliques.",
    "images": [
      {
        "path": "/images/products/mcl8/01-45306241903b.png"
      },
      {
        "path": "/images/products/mcl8/02-960c93e35d79.png"
      },
      {
        "path": "/images/products/mcl8/03-eedf28a0f2d5.png"
      },
      {
        "path": "/images/products/mcl8/04-760ab073d15f.png"
      },
      {
        "path": "/images/products/mcl8/05-1ef97d1431b6.png"
      },
      {
        "path": "/images/products/mcl8/06-f75931ecb6d5.png"
      },
      {
        "path": "/images/products/mcl8/07-9796bd83edb8.png"
      },
      {
        "path": "/images/products/mcl8/08-93b4d822b6ef.png"
      },
      {
        "path": "/images/products/mcl8/09-32da01033038.jpg"
      },
      {
        "path": "/images/products/mcl8/10-2d4104b242ca.jpg"
      },
      {
        "path": "/images/products/mcl8/11-10a0506428f5.jpg"
      },
      {
        "path": "/images/products/mcl8/12-4a6c72144886.jpg"
      },
      {
        "path": "/images/products/mcl8/13-127add2d73be.jpg"
      },
      {
        "path": "/images/products/mcl8/14-6fe87095100c.jpg"
      },
      {
        "path": "/images/products/mcl8/15-ec354e137e2f.jpg"
      },
      {
        "path": "/images/products/mcl8/16-327e292cbafe.jpg"
      },
      {
        "path": "/images/products/mcl8/17-bdaead8484e0.jpg"
      },
      {
        "path": "/images/products/mcl8/18-1d4a2177a61b.jpg"
      },
      {
        "path": "/images/products/mcl8/19-b1018d90433e.jpg"
      },
      {
        "path": "/images/products/mcl8/20-7f759d7ebf44.jpg"
      },
      {
        "path": "/images/products/mcl8/21-09f8fd538244.jpg"
      },
      {
        "path": "/images/products/mcl8/22-344c5af5e29e.jpg"
      },
      {
        "path": "/images/products/mcl8/23-c188c5684ca9.jpg"
      },
      {
        "path": "/images/products/mcl8/24-478fdd938ea3.jpg"
      },
      {
        "path": "/images/products/mcl8/25-ecc7a59cbd41.jpg"
      },
      {
        "path": "/images/products/mcl8/26-c87f68d3c245.jpg"
      },
      {
        "path": "/images/products/mcl8/27-57080a43d45d.jpg"
      },
      {
        "path": "/images/products/mcl8/28-da512b3c8fcd.jpg"
      },
      {
        "path": "/images/products/mcl8/29-406ee4b99a86.jpg"
      },
      {
        "path": "/images/products/mcl8/30-9eddb7a8c689.jpg"
      },
      {
        "path": "/images/products/mcl8/31-646c752470d0.jpg"
      },
      {
        "path": "/images/products/mcl8/32-6cb64f43c8a7.jpg"
      },
      {
        "path": "/images/products/mcl8/33-08dde0f14252.jpg"
      },
      {
        "path": "/images/products/mcl8/34-68bc06b2dfef.jpg"
      },
      {
        "path": "/images/products/mcl8/35-03765a1b0b8b.jpg"
      },
      {
        "path": "/images/products/mcl8/36-cc13ca6dd9b2.jpg"
      },
      {
        "path": "/images/products/mcl8/37-850e8e2f34b0.jpg"
      },
      {
        "path": "/images/products/mcl8/38-f91f7a48135f.jpg"
      },
      {
        "path": "/images/products/mcl8/39-9d4149d4e63b.jpg"
      },
      {
        "path": "/images/products/mcl8/40-92e3455d969c.jpg"
      },
      {
        "path": "/images/products/mcl8/41-62efcc93a638.jpg"
      },
      {
        "path": "/images/products/mcl8/42-d276bbe3fa8d.jpg"
      },
      {
        "path": "/images/products/mcl8/43-dc3fb60f7907.jpg"
      },
      {
        "path": "/images/products/mcl8/44-1fa5b5923dc1.jpg"
      },
      {
        "path": "/images/products/mcl8/45-374c1abb9b0c.jpg"
      },
      {
        "path": "/images/products/mcl8/46-34a0f42dfb1b.svg"
      }
    ],
    "detailSections": [],
    "accessories": [],
    "downloads": [
      {
        "label": "Télécharger",
        "url": "https://mecalac.com/fr/api_download/11005/MECALAC-Leaflet-MCL_SERIES-MCL-MK455-FR-web.pdf"
      },
      {
        "label": "Leaflet : MCL SERIES",
        "url": "https://mecalac.com/fr/api_download/11005/MECALAC-Leaflet-MCL_SERIES-MCL-MK455-FR-web.pdf"
      }
    ]
  },
  "as600": {
    "sourceUrl": "https://mecalac.com/fr/machine/as600.html",
    "descriptionFr": "La chargeuse Swing Mecalac AS600 est la plus compacte de la gamme. Doté d’une excellente stabilité grâce à son châssis rigide et ses 4 roues directrices, elle offre également le meilleur rayon de braquage (3185 mm) de sa catégorie en particulier lorsque son bras est orienté à 90°. Sa cabine spacieuse équipée de 2 portes offre à l’opérateur une excellente visibilité ce qui augmente encore son niveau de sécurité sur les chantiers.* Choisissez le Swing",
    "images": [
      {
        "path": "/images/products/as600/01-b8f84f7cc8c9.png"
      },
      {
        "path": "/images/products/as600/02-40161765a25d.png"
      },
      {
        "path": "/images/products/as600/03-53b3bd53c1d0.png"
      },
      {
        "path": "/images/products/as600/04-69ba41a54250.png"
      },
      {
        "path": "/images/products/as600/05-6fd1fd571784.png"
      },
      {
        "path": "/images/products/as600/06-05bed396cb5a.png"
      },
      {
        "path": "/images/products/as600/07-191bca002ea3.png"
      },
      {
        "path": "/images/products/as600/08-dbdde6dc4d89.png"
      },
      {
        "path": "/images/products/as600/09-6394ea270856.png"
      },
      {
        "path": "/images/products/as600/10-5d8e6a181c82.png"
      },
      {
        "path": "/images/products/as600/11-61aede7415fa.jpg"
      },
      {
        "path": "/images/products/as600/12-88249469e6db.jpg"
      },
      {
        "path": "/images/products/as600/13-447e1969abc5.jpg"
      },
      {
        "path": "/images/products/as600/14-2caf80672282.jpg"
      },
      {
        "path": "/images/products/as600/15-228f4c944367.jpg"
      },
      {
        "path": "/images/products/as600/16-602b15b6c5cc.jpg"
      },
      {
        "path": "/images/products/as600/17-e3e7973fb116.jpg"
      },
      {
        "path": "/images/products/as600/18-d9c241a68d51.jpg"
      },
      {
        "path": "/images/products/as600/19-42ecc34bb286.jpg"
      },
      {
        "path": "/images/products/as600/20-b4b8a619a39d.jpg"
      },
      {
        "path": "/images/products/as600/21-16aa45b1eb46.jpg"
      },
      {
        "path": "/images/products/as600/22-218536109abe.jpg"
      },
      {
        "path": "/images/products/as600/23-bf51cc389894.jpg"
      },
      {
        "path": "/images/products/as600/24-7ee15f274378.jpg"
      },
      {
        "path": "/images/products/as600/25-87c5d26b29de.jpg"
      },
      {
        "path": "/images/products/as600/26-d75870ed4669.jpg"
      },
      {
        "path": "/images/products/as600/27-ff08a962a524.jpg"
      },
      {
        "path": "/images/products/as600/28-d96190b856e6.jpg"
      },
      {
        "path": "/images/products/as600/29-3521dd505ac5.jpg"
      },
      {
        "path": "/images/products/as600/30-db9eefca080c.jpg"
      },
      {
        "path": "/images/products/as600/31-774785ec44b1.png"
      },
      {
        "path": "/images/products/as600/32-9271eef69e4b.svg"
      }
    ],
    "detailSections": [],
    "accessories": [],
    "downloads": [
      {
        "label": "Télécharger",
        "url": "https://mecalac.com/fr/api_download/5656/MECALAC-Leaflet-AS_SERIES-AS600_AS750_AS850_AS1000-MK400-FR-web.pdf"
      },
      {
        "label": "Leaflet : AS SERIES",
        "url": "https://mecalac.com/fr/api_download/5656/MECALAC-Leaflet-AS_SERIES-AS600_AS750_AS850_AS1000-MK400-FR-web.pdf"
      }
    ]
  },
  "as900tele": {
    "sourceUrl": "https://mecalac.com/fr/machine/as900tele.html",
    "descriptionFr": "L'AS900tele est une chargeuse à bras pivotant télescopique dotée d'un volume de godet de 0,7-1,2m³. Elle a une hauteur de levage maximale avec fourches à palette de 4,72 m, une portée maximale de 3,50 m et une charge utile maxi sur les fourches de 2270 kg. L'hydraulique auxiliaire performante permet entre autres l'utilisation de débroussailleuses, balayeuses, tarières et bennes preneuses. La machine peut être équipée en option d'un dispositif d'avertissement de surcharge.",
    "images": [
      {
        "path": "/images/products/as900tele/01-a08d6772c39f.png"
      },
      {
        "path": "/images/products/as900tele/02-25b73a0671d5.png"
      },
      {
        "path": "/images/products/as900tele/03-29113a50bc84.png"
      },
      {
        "path": "/images/products/as900tele/04-2142b04b6724.png"
      },
      {
        "path": "/images/products/as900tele/05-738549a68ef1.png"
      },
      {
        "path": "/images/products/as900tele/06-dab4c63e0305.jpg"
      },
      {
        "path": "/images/products/as900tele/07-f4708844a609.jpg"
      },
      {
        "path": "/images/products/as900tele/08-aee95be4e122.jpg"
      },
      {
        "path": "/images/products/as900tele/09-2318191c8266.jpg"
      },
      {
        "path": "/images/products/as900tele/10-ccd4be41f514.jpg"
      },
      {
        "path": "/images/products/as900tele/11-c332b6c80338.jpg"
      },
      {
        "path": "/images/products/as900tele/12-474d144d6cf9.jpg"
      },
      {
        "path": "/images/products/as900tele/13-2fe76c8b3dac.jpg"
      },
      {
        "path": "/images/products/as900tele/14-27649cf4aa9c.jpg"
      },
      {
        "path": "/images/products/as900tele/15-8dcba73a1444.jpg"
      },
      {
        "path": "/images/products/as900tele/16-6e659e7bf3f4.jpg"
      },
      {
        "path": "/images/products/as900tele/17-ba347351ea2f.svg"
      }
    ],
    "detailSections": [],
    "accessories": [],
    "downloads": [
      {
        "label": "Télécharger",
        "url": "https://mecalac.com/fr/api_download/5259/MECALAC-Leaflet-AS900tele-AS900tele-MK319-FR-web.pdf"
      },
      {
        "label": "Leaflet : AS900tele",
        "url": "https://mecalac.com/fr/api_download/5259/MECALAC-Leaflet-AS900tele-AS900tele-MK319-FR-web.pdf"
      }
    ]
  },
  "as1600": {
    "sourceUrl": "https://mecalac.com/fr/machine/as1600-1.html",
    "descriptionFr": "L’AS1600 est le nouveau produit phare dans la classe 11 tonnes. Elle a été conçue comme chargeuse « Swing » professionnelle, qui répond aux exigences élevées en termes de performance, d’économie, de fiabilité, de confort et de polyvalence. Dans sa classe de performances, elle est la seule chargeuse atteignant une hauteur utile de chargement de 3,40 m et elle se prête de manière idéale à des chantiers exigus avec un rayon de braquage de seulement 4,35 m par arrière. L’AS1600 est dotée d’un moteur Deutz turbo diesel d’une puissance de 100 kW refroidi par eau avec refroidissement de l’air de suralimentation et d’un catalyseur d’oxydation diesel (DOC). Le système d’injection performant Common Rail et le réglage du moteur électronique avec connexion intelligente au gestionnaire d’entraînement garantissent une puissance du moteur optimale pour une consommation en courant faible.",
    "images": [
      {
        "path": "/images/products/as1600/01-ff2d7df64aeb.png"
      },
      {
        "path": "/images/products/as1600/02-7b9df3363594.png"
      },
      {
        "path": "/images/products/as1600/03-7ea4ad655901.png"
      },
      {
        "path": "/images/products/as1600/04-495049b253f9.jpg"
      },
      {
        "path": "/images/products/as1600/05-151dd1481e21.jpg"
      },
      {
        "path": "/images/products/as1600/06-54b08cea897b.png"
      },
      {
        "path": "/images/products/as1600/07-4d8cdc64ed06.svg"
      }
    ],
    "detailSections": [],
    "accessories": [],
    "downloads": [
      {
        "label": "Télécharger",
        "url": "https://mecalac.com/fr/api_download/9098/MECALAC-Leaflet-AS1600_AS210-AS1600_AS210-MK417-FR-web.pdf"
      },
      {
        "label": "Leaflet : AS1600 AS210",
        "url": "https://mecalac.com/fr/api_download/9098/MECALAC-Leaflet-AS1600_AS210-AS1600_AS210-MK417-FR-web.pdf"
      }
    ]
  },
  "ax1000": {
    "sourceUrl": "https://mecalac.com/fr/machine/ax1000.html",
    "descriptionFr": "Le pro des chantiers difficiles puise sa force de persuasion dans la puissante cinématique en Z avec deux vérins de levage. Guidage parallèle adapté à l’application, puissance d'arrachement élevées et rythme de travail rapide vont de soi. En plus des essieux à blocage de différentiel selon le besoin, une autre caractéristique-produit marquante de la série AX est le châssis articulé avec système auto-stabilisant Mecalac. Cette technique sert à améliorer les caractéristiques de déplacement et à augmenter la stabilité.",
    "images": [
      {
        "path": "/images/products/ax1000/01-c0fde119e812.png"
      },
      {
        "path": "/images/products/ax1000/02-dc6160d8d21b.png"
      },
      {
        "path": "/images/products/ax1000/03-386f0c78a23f.jpg"
      },
      {
        "path": "/images/products/ax1000/04-48a7bd75b825.jpg"
      },
      {
        "path": "/images/products/ax1000/05-52924e33241c.jpg"
      },
      {
        "path": "/images/products/ax1000/06-33e7dce5d99e.svg"
      }
    ],
    "detailSections": [],
    "accessories": [],
    "downloads": [
      {
        "label": "Télécharger",
        "url": "https://mecalac.com/fr/api_download/5247/MECALAC-Leaflet-AX_SERIES-AX-MK355-FR-web.pdf"
      },
      {
        "label": "Leaflet : AX SERIES",
        "url": "https://mecalac.com/fr/api_download/5247/MECALAC-Leaflet-AX_SERIES-AX-MK355-FR-web.pdf"
      }
    ]
  },
  "tlb830": {
    "sourceUrl": "https://mecalac.com/fr/machine/tlb830.html",
    "descriptionFr": "Conçu et pensé pour le marché de la location, le TLB830 dispose d'un moteur puissant de 70kw (94hp) Tier 3 / Stage IIIA, avec un couple de 392 Nm (2898lbf). La transmission 'Synchro\" offre des vitesses de déplacement allant jusqu'à 38 km/h (23 mph) qui permettent des transferts rapides entre les chantiers. La flèche \"banane\" augmente la visibilité lorsque vous travaillez dans des espaces confinés où le chargement des camions au plus proche de la machine ou encore manoeuvrer au dessus d'obstacles, sont nécessaires. C'est grâce aux commandes \"servo\"contrôle\" SAE/ISO sur commutateur, que tous les opérateurs interviennent confortablement et efficacement. Le chargeur frontal s'équipe en standard d'un godet de 1m3. Combiné avec un rayon de braquage de 7,9 m, la force de poussée et la hauteur de manutention rendent le chargement simple et rapide.",
    "images": [
      {
        "path": "/images/products/tlb830/01-f6aac3443ecc.png"
      },
      {
        "path": "/images/products/tlb830/02-27d22f6d3163.png"
      },
      {
        "path": "/images/products/tlb830/03-1d12eff22c8a.svg"
      }
    ],
    "detailSections": [],
    "accessories": [],
    "downloads": []
  },
  "tlb870": {
    "sourceUrl": "https://mecalac.com/fr/machine/tlb870.html",
    "descriptionFr": "La chargeuse-pelleteuse TLB870 est le choix idéal pour répondre aux besoins de votre parc machines. Le TLB870 l'entrée de gamme des chargeuses-pelleteuses Mecalac. Il offre une grande facilité d'utilisation que ce soit en creusement, en manutention, en transport de matériaux ou encore en transfert entre les chantiers. Le moteur 55kw (74 hp) Stage 5 (Tier 4 final) répond aux réglementations concernant les émissions polluantes sans avoir à utiliser l'ADBlue. Pour les pays non régulés, la version 70kw Stage IIIA (Tier 3) est disponible. Les deux motorisations offrent une puissance équilibrée pour des fonctions efficaces. Un système hydraulique intelligent et efficace de «chargeur intégré» assure le contrôle automatique des deux pompes pour améliorer l'efficacité et le contrôle du carburant. La meilleure profondeur de fouille, la meilleure portée et la meilleure force d'arrachement dans sa catégorie, font de la chargeuse-pelleteuse TLB870 Mecalac, une machine d'une incroyable efficacité.",
    "images": [
      {
        "path": "/images/products/tlb870/01-704d0695e7aa.png"
      },
      {
        "path": "/images/products/tlb870/02-d83e89e1279a.png"
      },
      {
        "path": "/images/products/tlb870/03-02f867fdbd55.svg"
      }
    ],
    "detailSections": [],
    "accessories": [],
    "downloads": [
      {
        "label": "Télécharger",
        "url": "https://mecalac.com/fr/api_download/5377/MECALAC-Leaflet-TLB_Sideshift_Serie_Stage_III-TLB870_TLB890_TLB990-MK000-FR-web.pdf"
      },
      {
        "label": "Télécharger",
        "url": "https://mecalac.com/fr/api_download/9018/MECALAC-Leaflet-TLB_Sideshift_Serie_Stage_V-TLB870_TLB880_TLB890_TLB990-MK305-FR-web.pdf"
      },
      {
        "label": "Leaflet : TLB Sideshift Serie Stage III",
        "url": "https://mecalac.com/fr/api_download/5377/MECALAC-Leaflet-TLB_Sideshift_Serie_Stage_III-TLB870_TLB890_TLB990-MK000-FR-web.pdf"
      },
      {
        "label": "Leaflet : TLB Sideshift Serie Stage V",
        "url": "https://mecalac.com/fr/api_download/9018/MECALAC-Leaflet-TLB_Sideshift_Serie_Stage_V-TLB870_TLB880_TLB890_TLB990-MK305-FR-web.pdf"
      }
    ]
  },
  "tlb880": {
    "sourceUrl": "https://mecalac.com/fr/machine/tlb880.html",
    "descriptionFr": "La puissance et la conception robuste du TLB880 en font une chargeuse-pelleteuse idéale pour les petites et moyennes entreprises ainsi que les flottes de location recherchant à la fois performances et économies. Propulsé par un moteur diesel conforme aux normes Stage V, le TLB880 est une machine puissante délivrant jusqu'à 100 ch (74,5 kW) pour garantir des opérations productives, économiques et silencieuses. Sur la route comme sur les chantiers, les transmissions Synchro Shuttle ou Servo Power Synchro (Powershift) du TLB880 offrent une traction maximale et une vitesse atteignant 40 km/h. Pour réduire les temps de cycle et les opérations de maintenance, le TLB880 dispose d’un circuit hydraulique à centre fermé et d’une double pompe à engrenages. Outre la cabine conforme aux normes ROPS et FOPS ISO 3471/3449, le TLB880 dispose d’un environnement pratique et intuitif, intégrant notamment des interfaces numériques et un système de commande sophistiqué permettant le réglage de nombreuses fonctionnalités.",
    "images": [
      {
        "path": "/images/products/tlb880/01-1f19ed2aa31e.png"
      },
      {
        "path": "/images/products/tlb880/02-6d5cbd53a89c.png"
      },
      {
        "path": "/images/products/tlb880/03-442a01ab067e.png"
      },
      {
        "path": "/images/products/tlb880/04-36dfaee4f294.png"
      },
      {
        "path": "/images/products/tlb880/05-0eceb10ab423.png"
      },
      {
        "path": "/images/products/tlb880/06-975268ab8792.png"
      },
      {
        "path": "/images/products/tlb880/07-c84430fa1895.png"
      },
      {
        "path": "/images/products/tlb880/08-b6ff34f6c8fc.png"
      },
      {
        "path": "/images/products/tlb880/09-9c6ba43b33bd.svg"
      }
    ],
    "detailSections": [],
    "accessories": [],
    "downloads": [
      {
        "label": "Télécharger",
        "url": "https://mecalac.com/fr/api_download/7472/MECALAC-Leaflet-TLB880_Launch-TLB880-MKTLB880-FR-web.pdf"
      },
      {
        "label": "Télécharger",
        "url": "https://mecalac.com/fr/api_download/9018/MECALAC-Leaflet-TLB_Sideshift_Serie_Stage_V-TLB870_TLB880_TLB890_TLB990-MK305-FR-web.pdf"
      },
      {
        "label": "Leaflet : TLB880 Launch",
        "url": "https://mecalac.com/fr/api_download/7472/MECALAC-Leaflet-TLB880_Launch-TLB880-MKTLB880-FR-web.pdf"
      },
      {
        "label": "Leaflet : TLB Sideshift Serie Stage V",
        "url": "https://mecalac.com/fr/api_download/9018/MECALAC-Leaflet-TLB_Sideshift_Serie_Stage_V-TLB870_TLB880_TLB890_TLB990-MK305-FR-web.pdf"
      }
    ]
  },
  "tlb890": {
    "sourceUrl": "https://mecalac.com/fr/machine/tlb890.html",
    "descriptionFr": "Conçu à partir des besoins des chauffeurs propriétaires, la chargeuse-pelleteuse TLB890 est une véritable bête de productivité proposant des niveaux impressionnants de portée et de profondeur de fouille avec des temps de cycle rapides et une économie supérieure. Poids lourd en termes de productivité avec des forces d'arrachement et des capacités de levage largement au dessus de la moyenne, le TLB890 répond idéalement à la plus large gamme d'applications incluant les travaux publics, la construction et la maintenance des routes, les services publics et l'agriculture. Proposant des temps de cycles très rapides et une productivité accrue, tout en conservant une valeur de revente élevée, le TLB890 participe à l'accroissement du retour sur investissement.",
    "images": [
      {
        "path": "/images/products/tlb890/01-9449bbd3d522.png"
      },
      {
        "path": "/images/products/tlb890/02-f60c8ecf9390.png"
      },
      {
        "path": "/images/products/tlb890/03-b0e378fc55e7.png"
      },
      {
        "path": "/images/products/tlb890/04-9739703863d1.png"
      },
      {
        "path": "/images/products/tlb890/05-ccb819942da2.png"
      },
      {
        "path": "/images/products/tlb890/06-b0e55d75a05c.png"
      },
      {
        "path": "/images/products/tlb890/07-a68f637625b8.jpg"
      },
      {
        "path": "/images/products/tlb890/08-87b709edafea.jpg"
      },
      {
        "path": "/images/products/tlb890/09-9d402a8a6717.jpg"
      },
      {
        "path": "/images/products/tlb890/10-33f2decb6b4c.jpg"
      },
      {
        "path": "/images/products/tlb890/11-3582fcf4560a.jpg"
      },
      {
        "path": "/images/products/tlb890/12-3796554301c0.jpg"
      },
      {
        "path": "/images/products/tlb890/13-4a79cd68e1ea.jpg"
      },
      {
        "path": "/images/products/tlb890/14-a1516eaa35ff.jpg"
      },
      {
        "path": "/images/products/tlb890/15-1e7de8a1d350.jpg"
      },
      {
        "path": "/images/products/tlb890/16-81820649df9b.jpg"
      },
      {
        "path": "/images/products/tlb890/17-20a2ffd0f58b.jpg"
      },
      {
        "path": "/images/products/tlb890/18-6d1c59805238.jpg"
      },
      {
        "path": "/images/products/tlb890/19-a7a8ac1b6070.jpg"
      },
      {
        "path": "/images/products/tlb890/20-6485c25cdb74.jpg"
      },
      {
        "path": "/images/products/tlb890/21-9b0bee76c621.jpg"
      },
      {
        "path": "/images/products/tlb890/22-080e62e528fd.jpg"
      },
      {
        "path": "/images/products/tlb890/23-4241c6e1fd73.jpg"
      },
      {
        "path": "/images/products/tlb890/24-7e02e4f84f77.jpg"
      },
      {
        "path": "/images/products/tlb890/25-60e4fdc444b5.jpg"
      },
      {
        "path": "/images/products/tlb890/26-16c1146efd2b.jpg"
      },
      {
        "path": "/images/products/tlb890/27-d6f242755a9e.jpg"
      },
      {
        "path": "/images/products/tlb890/28-d275d37c7697.jpg"
      },
      {
        "path": "/images/products/tlb890/29-2156dca059f8.jpg"
      },
      {
        "path": "/images/products/tlb890/30-614e8118b0ed.jpg"
      },
      {
        "path": "/images/products/tlb890/31-e00de215bccd.jpg"
      },
      {
        "path": "/images/products/tlb890/32-0513439b29bc.jpg"
      },
      {
        "path": "/images/products/tlb890/33-33f0cae70457.jpg"
      },
      {
        "path": "/images/products/tlb890/34-273cc6f90c67.jpg"
      },
      {
        "path": "/images/products/tlb890/35-aa596d0c1a3d.jpg"
      },
      {
        "path": "/images/products/tlb890/36-06044a376d79.jpg"
      },
      {
        "path": "/images/products/tlb890/37-a4f32b597bec.jpg"
      },
      {
        "path": "/images/products/tlb890/38-108c93326454.jpg"
      },
      {
        "path": "/images/products/tlb890/39-b12b856a4248.jpg"
      },
      {
        "path": "/images/products/tlb890/40-5383c5946da1.jpg"
      },
      {
        "path": "/images/products/tlb890/41-caaf0465acbf.jpg"
      },
      {
        "path": "/images/products/tlb890/42-0d818e058c33.jpg"
      },
      {
        "path": "/images/products/tlb890/43-a7505b04adf9.jpg"
      },
      {
        "path": "/images/products/tlb890/44-5e8b0081a1fa.jpg"
      },
      {
        "path": "/images/products/tlb890/45-4684df49f0ff.jpg"
      },
      {
        "path": "/images/products/tlb890/46-95df027b3ab7.jpg"
      },
      {
        "path": "/images/products/tlb890/47-0310998b1f4b.jpg"
      },
      {
        "path": "/images/products/tlb890/48-3045fa9c41fa.jpg"
      },
      {
        "path": "/images/products/tlb890/49-0de21e28b691.jpg"
      },
      {
        "path": "/images/products/tlb890/50-166b3194d474.jpg"
      },
      {
        "path": "/images/products/tlb890/51-96573f40caef.jpg"
      },
      {
        "path": "/images/products/tlb890/52-7691eed4cd91.jpg"
      },
      {
        "path": "/images/products/tlb890/53-7a2279e325ce.jpg"
      },
      {
        "path": "/images/products/tlb890/54-e85813a56dec.jpg"
      },
      {
        "path": "/images/products/tlb890/55-5be0a925d461.jpg"
      },
      {
        "path": "/images/products/tlb890/56-0e9e9f139ab4.jpg"
      },
      {
        "path": "/images/products/tlb890/57-13310596886d.jpg"
      },
      {
        "path": "/images/products/tlb890/58-e7f74331dab9.jpg"
      },
      {
        "path": "/images/products/tlb890/59-ae20f183273b.jpg"
      },
      {
        "path": "/images/products/tlb890/60-37d60114c488.jpg"
      },
      {
        "path": "/images/products/tlb890/61-e19dd263d889.jpg"
      },
      {
        "path": "/images/products/tlb890/62-bc07ccdbb14c.jpg"
      },
      {
        "path": "/images/products/tlb890/63-d451758d3d20.png"
      },
      {
        "path": "/images/products/tlb890/64-1cc4cb9eb7ae.svg"
      }
    ],
    "detailSections": [],
    "accessories": [],
    "downloads": [
      {
        "label": "Télécharger",
        "url": "https://mecalac.com/fr/api_download/5377/MECALAC-Leaflet-TLB_Sideshift_Serie_Stage_III-TLB870_TLB890_TLB990-MK000-FR-web.pdf"
      },
      {
        "label": "Télécharger",
        "url": "https://mecalac.com/fr/api_download/9018/MECALAC-Leaflet-TLB_Sideshift_Serie_Stage_V-TLB870_TLB880_TLB890_TLB990-MK305-FR-web.pdf"
      },
      {
        "label": "Leaflet : TLB Sideshift Serie Stage III",
        "url": "https://mecalac.com/fr/api_download/5377/MECALAC-Leaflet-TLB_Sideshift_Serie_Stage_III-TLB870_TLB890_TLB990-MK000-FR-web.pdf"
      },
      {
        "label": "Leaflet : TLB Sideshift Serie Stage V",
        "url": "https://mecalac.com/fr/api_download/9018/MECALAC-Leaflet-TLB_Sideshift_Serie_Stage_V-TLB870_TLB880_TLB890_TLB990-MK305-FR-web.pdf"
      }
    ]
  },
  "tlb990": {
    "sourceUrl": "https://mecalac.com/fr/machine/tlb990.html",
    "descriptionFr": "La chargeuse-pelleteuse TLB990 est conçue pour les professionnels qui exigent une performance élevée et une rentabilité tout au long de l'année avec un excellent retour sur investissement. Le système de direction combiné avec les 4 roues motrices fournit une excellente traction qui permet au TLB990 de travailler dans des conditions où d'autres engins ne le pourraient simplement pas. C'est grâce à la marche en crabe que la chargeuse-pelleteuse TLB990 Mecalac, intervient dans les espaces les plus restreints réduisant ainsi le besoin de machines complémentaires. Vous pouvez sélectionner entre 2 ou 4 roues en crabe simplement en quelques secondes avec l'interrupteur.",
    "images": [
      {
        "path": "/images/products/tlb990/01-b8c34130fcc0.png"
      },
      {
        "path": "/images/products/tlb990/02-ec9a18262ece.png"
      },
      {
        "path": "/images/products/tlb990/03-0819d310f44d.png"
      },
      {
        "path": "/images/products/tlb990/04-dbd5c94c5a5f.png"
      },
      {
        "path": "/images/products/tlb990/05-31695e51baa8.png"
      },
      {
        "path": "/images/products/tlb990/06-94d5844056b0.png"
      },
      {
        "path": "/images/products/tlb990/07-3e15e6a6f9f2.png"
      },
      {
        "path": "/images/products/tlb990/08-1bd0b7cf03b8.png"
      },
      {
        "path": "/images/products/tlb990/09-23a39ab7c167.jpg"
      },
      {
        "path": "/images/products/tlb990/10-78ff34cc823f.jpg"
      },
      {
        "path": "/images/products/tlb990/11-ab3c9dc7dd50.jpg"
      },
      {
        "path": "/images/products/tlb990/12-f5b7e4f74fdb.jpg"
      },
      {
        "path": "/images/products/tlb990/13-1ebc6eeade6a.jpg"
      },
      {
        "path": "/images/products/tlb990/14-98c737a33d7d.jpg"
      },
      {
        "path": "/images/products/tlb990/15-352d423594a8.svg"
      }
    ],
    "detailSections": [],
    "accessories": [],
    "downloads": [
      {
        "label": "Télécharger",
        "url": "https://mecalac.com/fr/api_download/5377/MECALAC-Leaflet-TLB_Sideshift_Serie_Stage_III-TLB870_TLB890_TLB990-MK000-FR-web.pdf"
      },
      {
        "label": "Télécharger",
        "url": "https://mecalac.com/fr/api_download/9018/MECALAC-Leaflet-TLB_Sideshift_Serie_Stage_V-TLB870_TLB880_TLB890_TLB990-MK305-FR-web.pdf"
      },
      {
        "label": "Leaflet : TLB Sideshift Serie Stage III",
        "url": "https://mecalac.com/fr/api_download/5377/MECALAC-Leaflet-TLB_Sideshift_Serie_Stage_III-TLB870_TLB890_TLB990-MK000-FR-web.pdf"
      },
      {
        "label": "Leaflet : TLB Sideshift Serie Stage V",
        "url": "https://mecalac.com/fr/api_download/9018/MECALAC-Leaflet-TLB_Sideshift_Serie_Stage_V-TLB870_TLB880_TLB890_TLB990-MK305-FR-web.pdf"
      }
    ]
  },
  "emdx": {
    "sourceUrl": "https://mecalac.com/fr/machine/emdx.html",
    "descriptionFr": "LOGISTIQUE SANS ÉMISSION Les dumpers sont des machines complémentaires qui peuvent rapidement changer la dynamique d’un chantier. Ces machines compactes, maniables et à l’aise sur tous les types de terrains constituent une solution efficace pour le transport de matériaux sur les chantiers. Le nouveau dumper Mecalac eMDX conserve les fondamentaux et l’expérience des dumpers Mecalac 6MDX en termes de productivité, de sécurité et de fiabilité, mais il intègre l’expertise et les technologies Mecalac en termes de solutions zéro émission.",
    "images": [
      {
        "path": "/images/products/emdx/01-7f34d62ab370.png"
      },
      {
        "path": "/images/products/emdx/02-b841a09e229e.png"
      },
      {
        "path": "/images/products/emdx/03-bdcb36c3a0e2.svg"
      }
    ],
    "detailSections": [],
    "accessories": [],
    "downloads": [
      {
        "label": "Télécharger",
        "url": "https://mecalac.com/fr/api_download/7697/MECALAC-Leaflet-Zero_Emission-ZE-MK420-FR-web.pdf"
      },
      {
        "label": "Leaflet : Zero Emission",
        "url": "https://mecalac.com/fr/api_download/7697/MECALAC-Leaflet-Zero_Emission-ZE-MK420-FR-web.pdf"
      }
    ]
  },
  "revotruck-9": {
    "sourceUrl": "https://mecalac.com/fr/machine/revotruck9.html",
    "descriptionFr": "Le Revotruck 9 est l'expression de ce design révolutionnaire dans une version de 9 tonnes de charge utile. Mecalac a conçu le Revotruck, une machine unique qui associe la révolution de la cabine aux capacités hors normes des camions tout-terrain. Les opérateurs peuvent désormais faire pivoter l’ensemble de la cabine par une simple impulsion sur un bouton, afin de garder leur vision et leur attention sur le travail ainsi que les obstacles sur le chantier. Le châssis spécifique à oscillation centrale assure stabilité et traction sur tous types de terrain.Associé à une extrême facilité d’utilisation et d’accessibilité, le Revotruck rend le transport de matériaux plus intelligent et plus sûr.Tout en conservant les caractéristiques innovantes de Mecalac et en tirant parti de sa grande expertise en matière de dumpers de chantier, le Revotruck 9 offre non seulement une capacité de charge accrue pouvant atteindre 9 tonnes, mais il incarne également l'excellence concentrée observée dans la version 6-T.",
    "images": [
      {
        "path": "/images/products/revotruck-9/01-bf0824adf665.png"
      },
      {
        "path": "/images/products/revotruck-9/02-68dcde27935b.png"
      },
      {
        "path": "/images/products/revotruck-9/03-b0888d6e87e4.png"
      },
      {
        "path": "/images/products/revotruck-9/04-89f25d4245bf.png"
      },
      {
        "path": "/images/products/revotruck-9/05-cc60de7548ca.png"
      },
      {
        "path": "/images/products/revotruck-9/06-0634083a20c5.png"
      },
      {
        "path": "/images/products/revotruck-9/07-2b2e0b29ff07.png"
      },
      {
        "path": "/images/products/revotruck-9/08-b0e022ac232a.png"
      },
      {
        "path": "/images/products/revotruck-9/09-f3d5fd0355de.jpg"
      },
      {
        "path": "/images/products/revotruck-9/10-545e3c549784.jpg"
      },
      {
        "path": "/images/products/revotruck-9/11-e0932ef57091.jpg"
      },
      {
        "path": "/images/products/revotruck-9/12-0c01739b6e70.jpg"
      },
      {
        "path": "/images/products/revotruck-9/13-d55ee680d9a7.jpg"
      },
      {
        "path": "/images/products/revotruck-9/14-365cdcb57b43.jpg"
      },
      {
        "path": "/images/products/revotruck-9/15-e56e4a25f66c.svg"
      }
    ],
    "detailSections": [],
    "accessories": [],
    "downloads": [
      {
        "label": "Télécharger",
        "url": "https://mecalac.com/fr/api_download/10380/MECALAC-Leaflet-Revotruck-Revotruck-MK421-FR-web.pdf"
      },
      {
        "label": "Leaflet : Revotruck",
        "url": "https://mecalac.com/fr/api_download/10380/MECALAC-Leaflet-Revotruck-Revotruck-MK421-FR-web.pdf"
      }
    ]
  },
  "ta3": {
    "sourceUrl": "https://mecalac.com/fr/machine/ta3.html",
    "descriptionFr": "Le dumper TA3 ouvre la voie aux chantiers de taille moyenne tout en conservant sa polyvalence et son agilité, sans compromis sur la robustesse. Conçue pour des chantiers de petite à moyenne taille, la gamme Mecalac TA3, composée du TA3H et du TA3SH, offre une grande polyvalence pour transporter efficacement les matériaux. Avec une charge utile de 3000 kg (6,614 lb), vous avez le choix entre une benne à déversement direct ou une benne à rotation à 180° ce qui permet une grande précision de déversement d'un côté ou de l'autre de la machine. La transmission hydrostatique délivre une souplesse et une puissance ininterrompue pour l'opérateur. La gamme TA3 est équipée d’un moteur de 18,5 kW (25 hp).L'interface de commande simple d'utilisation permet à tous types de chauffeurs une prise en main rapide.",
    "images": [
      {
        "path": "/images/products/ta3/01-651c6c616d1b.png"
      },
      {
        "path": "/images/products/ta3/02-eb5d41400955.png"
      },
      {
        "path": "/images/products/ta3/03-14798d8a836e.png"
      },
      {
        "path": "/images/products/ta3/04-684069e025c0.png"
      },
      {
        "path": "/images/products/ta3/05-908feffce9e5.png"
      },
      {
        "path": "/images/products/ta3/06-d06df4d7554c.png"
      },
      {
        "path": "/images/products/ta3/07-2f62c5922ca4.png"
      },
      {
        "path": "/images/products/ta3/08-d3ef7c94a538.png"
      },
      {
        "path": "/images/products/ta3/09-33c450aadc2c.png"
      },
      {
        "path": "/images/products/ta3/10-48476c140215.png"
      },
      {
        "path": "/images/products/ta3/11-8d372264728e.png"
      },
      {
        "path": "/images/products/ta3/12-42be2316d6fc.png"
      },
      {
        "path": "/images/products/ta3/13-367440527699.png"
      },
      {
        "path": "/images/products/ta3/14-87344ef0b67c.jpg"
      },
      {
        "path": "/images/products/ta3/15-6a6ef653a3a6.jpg"
      },
      {
        "path": "/images/products/ta3/16-6fb4f22b94bc.jpg"
      },
      {
        "path": "/images/products/ta3/17-c3a69e05b998.jpg"
      },
      {
        "path": "/images/products/ta3/18-6c85afa316eb.jpg"
      },
      {
        "path": "/images/products/ta3/19-eb249ac000d8.jpg"
      },
      {
        "path": "/images/products/ta3/20-8fb331154334.jpg"
      },
      {
        "path": "/images/products/ta3/21-c4b445a61de9.jpg"
      },
      {
        "path": "/images/products/ta3/22-3fc0d3125ba2.jpg"
      },
      {
        "path": "/images/products/ta3/23-cd699e848912.jpg"
      },
      {
        "path": "/images/products/ta3/24-729d2b7a78d1.jpg"
      },
      {
        "path": "/images/products/ta3/25-5dca1c169fca.jpg"
      },
      {
        "path": "/images/products/ta3/26-29883d0d8bec.jpg"
      },
      {
        "path": "/images/products/ta3/27-40466056bc26.jpg"
      },
      {
        "path": "/images/products/ta3/28-da99fdbb6810.jpg"
      },
      {
        "path": "/images/products/ta3/29-acac94300322.jpg"
      },
      {
        "path": "/images/products/ta3/30-f73bc5354051.jpg"
      },
      {
        "path": "/images/products/ta3/31-6b0ead429f49.jpg"
      },
      {
        "path": "/images/products/ta3/32-baf109859248.jpg"
      },
      {
        "path": "/images/products/ta3/33-af7330140077.jpg"
      },
      {
        "path": "/images/products/ta3/34-91006f5fde72.jpg"
      },
      {
        "path": "/images/products/ta3/35-cab4d82316f9.png"
      },
      {
        "path": "/images/products/ta3/36-68c1df6276ef.svg"
      }
    ],
    "detailSections": [],
    "accessories": [],
    "downloads": [
      {
        "label": "Télécharger",
        "url": "https://mecalac.com/fr/api_download/11211/MECALAC-Leaflet-TA_SERIE-TA.1.3_TA.6.10-MK453-FR-web.pdf"
      },
      {
        "label": "Leaflet : TA SERIE",
        "url": "https://mecalac.com/fr/api_download/11211/MECALAC-Leaflet-TA_SERIE-TA.1.3_TA.6.10-MK453-FR-web.pdf"
      }
    ]
  },
  "ta6": {
    "sourceUrl": "https://mecalac.com/fr/machine/ta6.html",
    "descriptionFr": "Le dumper TA6 ouvre la voie aux projets de moyenne à grande envergure, doublant la charge utile par rapport au modèle inférieur, tout en améliorant la mobilité tout-terrain et la sécurité. Conçu pour les chantiers de taille moyenne à plus importante, le dumper TA6, équipé d'un moteur de 55 kW (74 ch), offre une grande polyvalence pour le transport de matériaux. Avec une charge utile de 6000 kg (13,223 lb), vous aurez le choix entre une benne à déversement direct pour le transport en vrac ou à rotation à 180° pour déverser précisément les charges de chaque côté de la machine. La transmission hydrostatique permet d’atteindre une vitesse maximale de 25 km/h (15,5 mph), les 4 roues motrices permanentes et l'articulation centrale sont garantes d'une traction efficace même dans les conditions les plus difficiles. Conformes aux dernières normes de sécurité, les dumpers TA6 Mecalac sont dotés d’une caméra avant, d’un inclinomètre, de barrières latérales de protection pour l'opérateur et d’un arceau ROPS repliable pour une sécurité accrue.",
    "images": [
      {
        "path": "/images/products/ta6/01-b080a190c0a5.png"
      },
      {
        "path": "/images/products/ta6/02-785d7f4cba92.png"
      },
      {
        "path": "/images/products/ta6/03-bf48de19b6fd.png"
      },
      {
        "path": "/images/products/ta6/04-5e4580c4d03f.png"
      },
      {
        "path": "/images/products/ta6/05-df56f42d9893.png"
      },
      {
        "path": "/images/products/ta6/06-37fde78db034.png"
      },
      {
        "path": "/images/products/ta6/07-740a3878f415.jpg"
      },
      {
        "path": "/images/products/ta6/08-f55f1daa2fa4.jpg"
      },
      {
        "path": "/images/products/ta6/09-cc21f049f8da.jpg"
      },
      {
        "path": "/images/products/ta6/10-6d845444f6bc.jpg"
      },
      {
        "path": "/images/products/ta6/11-337853b4cbfd.jpg"
      },
      {
        "path": "/images/products/ta6/12-827aedeeb7c3.jpg"
      },
      {
        "path": "/images/products/ta6/13-a15c2a6ef239.jpg"
      },
      {
        "path": "/images/products/ta6/14-15361df87f05.jpg"
      },
      {
        "path": "/images/products/ta6/15-62970001a59c.png"
      },
      {
        "path": "/images/products/ta6/16-cdb7d6ceff6c.svg"
      }
    ],
    "detailSections": [],
    "accessories": [],
    "downloads": [
      {
        "label": "Télécharger",
        "url": "https://mecalac.com/fr/api_download/11211/MECALAC-Leaflet-TA_SERIE-TA.1.3_TA.6.10-MK453-FR-web.pdf"
      },
      {
        "label": "Leaflet : TA SERIE",
        "url": "https://mecalac.com/fr/api_download/11211/MECALAC-Leaflet-TA_SERIE-TA.1.3_TA.6.10-MK453-FR-web.pdf"
      }
    ]
  },
  "ta9": {
    "sourceUrl": "https://mecalac.com/fr/machine/ta9.html",
    "descriptionFr": "Le dumper TA9 est conçu pour les projets de grande envergure où la productivité est essentielle, offrant la plus grande charge utile tout en conservant le même niveau de polyvalence, de sécurité et de performances tout-terrain. Conçu pour les chantiers de grande eenvergure, le dumper TA9 est équipé d’un moteur de 55 kW (74 ch) et offre une grande productivité pour le transport de matériaux. Avec une charge utile de 9 000 kg (19,841 lb), le TA9 est désormais proposé exclusivement avec une benne à déversement direct, idéale pour le transport en vrac. Sa transmission hydrostatique permet d’atteindre une vitesse maximale de 25 km/h (15,5 mph), les 4 roues motrices permanentes et l'articulation centrale sont garantes d'une traction efficace même dans les conditions les plus difficiles. Conforme aux dernières normes de sécurité, le dumper TA9 Mecalac est doté d’une caméra avant, d’un inclinomètre, de barrières latérales de protection pour l'opérateur et d’un arceau ROPS repliable pour une sécurité accrue.",
    "images": [
      {
        "path": "/images/products/ta9/01-2be6e758ce32.png"
      },
      {
        "path": "/images/products/ta9/02-fa4d80a8f349.png"
      },
      {
        "path": "/images/products/ta9/03-2eaa1c73e048.png"
      },
      {
        "path": "/images/products/ta9/04-787220555914.jpg"
      },
      {
        "path": "/images/products/ta9/05-64db9cd11c8e.jpg"
      },
      {
        "path": "/images/products/ta9/06-7e4856ea0231.jpg"
      },
      {
        "path": "/images/products/ta9/07-2c9aa6f3a32f.jpg"
      },
      {
        "path": "/images/products/ta9/08-0a613c1fc97d.svg"
      }
    ],
    "detailSections": [],
    "accessories": [],
    "downloads": [
      {
        "label": "Télécharger",
        "url": "https://mecalac.com/fr/api_download/11211/MECALAC-Leaflet-TA_SERIE-TA.1.3_TA.6.10-MK453-FR-web.pdf"
      },
      {
        "label": "Leaflet : TA SERIE",
        "url": "https://mecalac.com/fr/api_download/11211/MECALAC-Leaflet-TA_SERIE-TA.1.3_TA.6.10-MK453-FR-web.pdf"
      }
    ]
  },
  "6mdx": {
    "sourceUrl": "https://mecalac.com/fr/machine/6mdx.html",
    "descriptionFr": "Le dumper 6MDX offre un équilibre parfait :performance et compacité, tout en gardant à l'esprit la sécurité et le confort. Conçu pour la sécurité, le confort et la performance le 6MDX est une machine compacte et maniable, offrant une solution efficace pour transporter de lourdes charges dans des espaces confinés, sur tout type de terrain. Avec une charge utile de 6000 kg (13,228 lb), vous avez le choix entre la benne à déversement direct pour le transport de matériaux en vrac ou ou une benne à rotation à 180° ce qui permet une grande précision de déversement d'un côté ou de l'autre de la machine. La transmission hydrostatique permet d’atteindre une vitesse maximale de 25 km/h (15,5 mph). Conçu dès l’origine pour la sécurité le MDX combine une cabine entièrement fermée certifiée ROPS/FOPS avec des caractéristiques de conception intelligentes qui facilitent l'accès, améliorent la visibilité et renforcent la protection de l'opérateur, quelles que soient les conditions.",
    "images": [
      {
        "path": "/images/products/6mdx/01-0965db6a11fc.png"
      },
      {
        "path": "/images/products/6mdx/02-a1b10dbb2b3a.png"
      },
      {
        "path": "/images/products/6mdx/03-e18d9b726d51.png"
      },
      {
        "path": "/images/products/6mdx/04-692b5f19c9fc.png"
      },
      {
        "path": "/images/products/6mdx/05-c16964a04b2a.png"
      },
      {
        "path": "/images/products/6mdx/06-756658678de7.png"
      },
      {
        "path": "/images/products/6mdx/07-1878b938245d.png"
      },
      {
        "path": "/images/products/6mdx/08-41b9c3d1f7e3.png"
      },
      {
        "path": "/images/products/6mdx/09-131909044896.png"
      },
      {
        "path": "/images/products/6mdx/10-e4c1eed7e729.png"
      },
      {
        "path": "/images/products/6mdx/11-8dbb7252b16f.png"
      },
      {
        "path": "/images/products/6mdx/12-fd69adf9d001.png"
      },
      {
        "path": "/images/products/6mdx/13-1a807e9ed14f.jpg"
      },
      {
        "path": "/images/products/6mdx/14-5d748d22be15.jpg"
      },
      {
        "path": "/images/products/6mdx/15-dd807bc89417.jpg"
      },
      {
        "path": "/images/products/6mdx/16-b84028b5fd27.jpg"
      },
      {
        "path": "/images/products/6mdx/17-2d20f4b7ff49.jpg"
      },
      {
        "path": "/images/products/6mdx/18-97931d7e9700.jpg"
      },
      {
        "path": "/images/products/6mdx/19-6bb6c82ce2f6.jpg"
      },
      {
        "path": "/images/products/6mdx/20-954b728367ec.jpg"
      },
      {
        "path": "/images/products/6mdx/21-c3720359b688.jpg"
      },
      {
        "path": "/images/products/6mdx/22-24abcbb15d32.jpg"
      },
      {
        "path": "/images/products/6mdx/23-46268fef3e16.jpg"
      },
      {
        "path": "/images/products/6mdx/24-dc438107f738.jpg"
      },
      {
        "path": "/images/products/6mdx/25-1bc8ac92472f.jpg"
      },
      {
        "path": "/images/products/6mdx/26-d0d5e8b789bd.jpg"
      },
      {
        "path": "/images/products/6mdx/27-9cef8323be04.jpg"
      },
      {
        "path": "/images/products/6mdx/28-6243829cc591.jpg"
      },
      {
        "path": "/images/products/6mdx/29-50d4e4921b12.jpg"
      },
      {
        "path": "/images/products/6mdx/30-d04fd8a32cc6.jpg"
      },
      {
        "path": "/images/products/6mdx/31-0f34649f300e.jpg"
      },
      {
        "path": "/images/products/6mdx/32-d730124ff71d.jpg"
      },
      {
        "path": "/images/products/6mdx/33-0b7c133112f5.jpg"
      },
      {
        "path": "/images/products/6mdx/34-37ce12e050ab.jpg"
      },
      {
        "path": "/images/products/6mdx/35-e93e8ac3e713.jpg"
      },
      {
        "path": "/images/products/6mdx/36-66b74c53ae79.png"
      },
      {
        "path": "/images/products/6mdx/37-f67d31ca650a.svg"
      }
    ],
    "detailSections": [],
    "accessories": [],
    "downloads": [
      {
        "label": "Télécharger",
        "url": "https://mecalac.com/fr/api_download/11131/MECALAC-Leaflet-MDX-MDX-MK456-FR-web.pdf"
      },
      {
        "label": "Leaflet : MDX",
        "url": "https://mecalac.com/fr/api_download/11131/MECALAC-Leaflet-MDX-MDX-MK456-FR-web.pdf"
      }
    ]
  },
  "9mdx": {
    "sourceUrl": "https://mecalac.com/fr/machine/9mdx.html",
    "descriptionFr": "Le dumper 9MDX offre le plus haut niveau de performance et de sécurité de la gamme. Conçu pour la sécurité, le confort et la performance le 9MDX est une machine compacte et maniable, offrant une solution efficace pour le transport de lourdes charges dans des espaces confinés, sur tout type de terrain. Avec une charge utile de 9000 kg (19,841 lb), vous avez le choix entre la benne à déversement direct pour le transport de matériaux en vrac ou ou une benne à rotation à 180° ce qui permet une grande précision de déversement d'un côté ou de l'autre de la machine. La transmission hydrostatique permet d’atteindre une vitesse maximale de 25 km/h (15,5 mph). Conçu dès l’origine pour la sécurité le MDX combine une cabine entièrement fermée certifiée ROPS/FOPS avec des caractéristiques de conception intelligentes qui facilitent l'accès, améliorent la visibilité et renforcent la protection de l'opérateur, quelles que soient les conditions.",
    "images": [
      {
        "path": "/images/products/9mdx/01-334fd13ca06b.png"
      },
      {
        "path": "/images/products/9mdx/02-90a85eec3fb2.jpg"
      },
      {
        "path": "/images/products/9mdx/03-87272336ab74.jpg"
      },
      {
        "path": "/images/products/9mdx/04-88f581b276f6.jpg"
      },
      {
        "path": "/images/products/9mdx/05-56a8cd80b9c6.svg"
      }
    ],
    "detailSections": [],
    "accessories": [],
    "downloads": [
      {
        "label": "Télécharger",
        "url": "https://mecalac.com/fr/api_download/11131/MECALAC-Leaflet-MDX-MDX-MK456-FR-web.pdf"
      },
      {
        "label": "Leaflet : MDX",
        "url": "https://mecalac.com/fr/api_download/11131/MECALAC-Leaflet-MDX-MDX-MK456-FR-web.pdf"
      }
    ]
  },
  "6mcr": {
    "sourceUrl": "https://mecalac.com/fr/machine/6mcr-2.html",
    "descriptionFr": "La pelle-skid 6MCR offre la compacité d'une mini-pelle avec les performances d'une pelle midi, et vous ouvre tout un nouveau monde de possibilités. Depuis plus de 10 ans, les pelles Mecalac MCR accomplissent efficacement toutes sortes de tâches. Nos clients se déplacent à 10 km/h, bénéficient d'une conduite au joystick et profitent d'une compacité imbattable, non seulement à l'arrière mais surtout à l'avant et en hauteur, compacité qui équivaut à celle d'une pelle de 2 tonnes. Notre conception unique est basée sur l'équilibre, la condition sinequanone pour la puissance de levage s'agissant d'un équipement compact. De plus, vous pouvez utiliser nos pelles comme une chargeuse compacte avec toutes ses commandes et ses accessoires, y compris des godets de 0,49m3 (0,64 yd3) qui sont deux fois plus volumineux que ceux des pelles traditionnelles de la même taille. Les pelles MCR de Mecalac vous offrent des avantages en matière de rentabilité qui vous hisseront au-dessus de la concurrence.",
    "images": [
      {
        "path": "/images/products/6mcr/01-d1d9eb247bc8.png"
      },
      {
        "path": "/images/products/6mcr/02-31fa637e92a1.png"
      },
      {
        "path": "/images/products/6mcr/03-41a73ec25737.png"
      },
      {
        "path": "/images/products/6mcr/04-3fb66b4e92f0.png"
      },
      {
        "path": "/images/products/6mcr/05-da7777a5536f.png"
      },
      {
        "path": "/images/products/6mcr/06-9e6c12f92765.png"
      },
      {
        "path": "/images/products/6mcr/07-111325b3da32.png"
      },
      {
        "path": "/images/products/6mcr/08-002da1e64b8a.png"
      },
      {
        "path": "/images/products/6mcr/09-f6bfb268b0f9.png"
      },
      {
        "path": "/images/products/6mcr/10-8cc8d142bcef.png"
      },
      {
        "path": "/images/products/6mcr/11-36febc0baf64.jpg"
      },
      {
        "path": "/images/products/6mcr/12-10815d3b0c06.jpg"
      },
      {
        "path": "/images/products/6mcr/13-fa8089687d51.jpg"
      },
      {
        "path": "/images/products/6mcr/14-7a47286ccd16.jpg"
      },
      {
        "path": "/images/products/6mcr/15-f63665c9b485.jpg"
      },
      {
        "path": "/images/products/6mcr/16-8de762c37961.jpg"
      },
      {
        "path": "/images/products/6mcr/17-3d5caac0066f.jpg"
      },
      {
        "path": "/images/products/6mcr/18-844e5f092cef.jpg"
      },
      {
        "path": "/images/products/6mcr/19-dc9b271b4497.jpg"
      },
      {
        "path": "/images/products/6mcr/20-708be1adb7c1.jpg"
      },
      {
        "path": "/images/products/6mcr/21-4c7a4e268bb1.jpg"
      },
      {
        "path": "/images/products/6mcr/22-c214f82c907d.jpg"
      },
      {
        "path": "/images/products/6mcr/23-158143d537bc.jpg"
      },
      {
        "path": "/images/products/6mcr/24-af13aab508d7.jpg"
      },
      {
        "path": "/images/products/6mcr/25-9cd38639f173.jpg"
      },
      {
        "path": "/images/products/6mcr/26-1216a8409ed0.jpg"
      },
      {
        "path": "/images/products/6mcr/27-cd8d14e81d89.jpg"
      },
      {
        "path": "/images/products/6mcr/28-a0d5092c9abf.jpg"
      },
      {
        "path": "/images/products/6mcr/29-19db13e28d44.jpg"
      },
      {
        "path": "/images/products/6mcr/30-6faa623db62c.jpg"
      },
      {
        "path": "/images/products/6mcr/31-d89aed180eb2.jpg"
      },
      {
        "path": "/images/products/6mcr/32-2fa92381eea2.jpg"
      },
      {
        "path": "/images/products/6mcr/33-d64463438e88.jpg"
      },
      {
        "path": "/images/products/6mcr/34-65ae453d66c6.jpg"
      },
      {
        "path": "/images/products/6mcr/35-952244f15e7a.jpg"
      },
      {
        "path": "/images/products/6mcr/36-2bc850d1e20c.jpg"
      },
      {
        "path": "/images/products/6mcr/37-491c9cfeea9f.jpg"
      },
      {
        "path": "/images/products/6mcr/38-d389f7da6ddd.png"
      },
      {
        "path": "/images/products/6mcr/39-0491c6031b7e.svg"
      }
    ],
    "detailSections": [],
    "accessories": [],
    "downloads": [
      {
        "label": "Télécharger",
        "url": "https://mecalac.com/fr/api_download/5184/MECALAC-Leaflet-MCR_SERIE-MCR-MK375-FR-web.pdf"
      },
      {
        "label": "Télécharger",
        "url": "https://mecalac.com/fr/api_download/10397/MECALAC-Leaflet-Tiltrotator_MR40_MR50_MR60-MR40_MR50_MR60_MWR_MCR_MC_12Series-MK399-FR-web.pdf"
      },
      {
        "label": "Leaflet : MCR SERIE",
        "url": "https://mecalac.com/fr/api_download/5184/MECALAC-Leaflet-MCR_SERIE-MCR-MK375-FR-web.pdf"
      },
      {
        "label": "Leaflet : Tiltrotator MR40 MR50 MR60",
        "url": "https://mecalac.com/fr/api_download/10397/MECALAC-Leaflet-Tiltrotator_MR40_MR50_MR60-MR40_MR50_MR60_MWR_MCR_MC_12Series-MK399-FR-web.pdf"
      }
    ]
  },
  "8mcr": {
    "sourceUrl": "https://mecalac.com/fr/machine/8mcr-2.html",
    "descriptionFr": "La pelle compacte 8MCR offre un rapport poids/performance imbattable et exceptionnel dans sa catégorie. Depuis plus de 10 ans, les pelles Mecalac MCR accomplissent efficacement toutes sortes de tâches. Nos clients se déplacent à 10 km/h, bénéficient d'une conduite au joystick et profitent d'une compacité imbattable, non seulement à l'arrière mais surtout à l'avant et en hauteur, compacité qui équivaut à celle d'une pelle de 2 tonnes. Notre conception unique est basée sur l'équilibre, la condition sinequanone pour la puissance de levage s'agissant d'un équipement compact. De plus, vous pouvez utiliser nos pelles comme une chargeuse compacte avec toutes ses commandes et ses accessoires, y compris des godets de 0,75m3 (0,98 yd3) qui sont deux fois plus volumineux que ceux des pelles traditionnelles de la même taille. Les pelles MCR de Mecalac vous offrent des avantages en matière de rentabilité qui vous hisseront au-dessus de la concurrence.",
    "images": [
      {
        "path": "/images/products/8mcr/01-418645a9a806.png"
      },
      {
        "path": "/images/products/8mcr/02-67cf6399a2cb.png"
      },
      {
        "path": "/images/products/8mcr/03-f8296b8c4196.png"
      },
      {
        "path": "/images/products/8mcr/04-fd55fa77fdd4.png"
      },
      {
        "path": "/images/products/8mcr/05-556ca8f287d7.png"
      },
      {
        "path": "/images/products/8mcr/06-25f428f4fb72.png"
      },
      {
        "path": "/images/products/8mcr/07-f09d5c1cd963.png"
      },
      {
        "path": "/images/products/8mcr/08-c11cc09e8dee.png"
      },
      {
        "path": "/images/products/8mcr/09-1c4480fc713a.png"
      },
      {
        "path": "/images/products/8mcr/10-b67083301dc9.png"
      },
      {
        "path": "/images/products/8mcr/11-8c0da1c7b628.png"
      },
      {
        "path": "/images/products/8mcr/12-a203256e5ff9.png"
      },
      {
        "path": "/images/products/8mcr/13-e498a6ada791.png"
      },
      {
        "path": "/images/products/8mcr/14-87344ef0b67c.jpg"
      },
      {
        "path": "/images/products/8mcr/15-6fb4f22b94bc.jpg"
      },
      {
        "path": "/images/products/8mcr/16-c3a69e05b998.jpg"
      },
      {
        "path": "/images/products/8mcr/17-6c85afa316eb.jpg"
      },
      {
        "path": "/images/products/8mcr/18-b80fb37a4134.jpg"
      },
      {
        "path": "/images/products/8mcr/19-7ccc47c9f8d6.jpg"
      },
      {
        "path": "/images/products/8mcr/20-617f8a23e8bb.jpg"
      },
      {
        "path": "/images/products/8mcr/21-5c0b26adf531.jpg"
      },
      {
        "path": "/images/products/8mcr/22-1ba541240625.jpg"
      },
      {
        "path": "/images/products/8mcr/23-d47b18470b77.jpg"
      },
      {
        "path": "/images/products/8mcr/24-1a2c4ec97dcd.jpg"
      },
      {
        "path": "/images/products/8mcr/25-e0b59d173653.jpg"
      },
      {
        "path": "/images/products/8mcr/26-3cc85f909566.jpg"
      },
      {
        "path": "/images/products/8mcr/27-a38242ccb061.jpg"
      },
      {
        "path": "/images/products/8mcr/28-07b860596088.jpg"
      },
      {
        "path": "/images/products/8mcr/29-d745665d8573.jpg"
      },
      {
        "path": "/images/products/8mcr/30-f48a2b11a094.jpg"
      },
      {
        "path": "/images/products/8mcr/31-612dfbbfd061.jpg"
      },
      {
        "path": "/images/products/8mcr/32-ef60d31c4b26.jpg"
      },
      {
        "path": "/images/products/8mcr/33-f22fe07dc9df.jpg"
      },
      {
        "path": "/images/products/8mcr/34-df1ed1583f24.jpg"
      },
      {
        "path": "/images/products/8mcr/35-02c1e7ceede4.jpg"
      },
      {
        "path": "/images/products/8mcr/36-3ceae85d0e24.jpg"
      },
      {
        "path": "/images/products/8mcr/37-b1c7acac51bb.jpg"
      },
      {
        "path": "/images/products/8mcr/38-04366eb79710.jpg"
      },
      {
        "path": "/images/products/8mcr/39-db120b5ba130.jpg"
      },
      {
        "path": "/images/products/8mcr/40-a375f848b390.jpg"
      },
      {
        "path": "/images/products/8mcr/41-fd85f62690ff.jpg"
      },
      {
        "path": "/images/products/8mcr/42-9c1695aab4c1.jpg"
      },
      {
        "path": "/images/products/8mcr/43-1a807e9ed14f.jpg"
      },
      {
        "path": "/images/products/8mcr/44-5d748d22be15.jpg"
      },
      {
        "path": "/images/products/8mcr/45-fdb696067749.jpg"
      },
      {
        "path": "/images/products/8mcr/46-ad19cb05db64.png"
      },
      {
        "path": "/images/products/8mcr/47-157eece299a9.svg"
      }
    ],
    "detailSections": [],
    "accessories": [],
    "downloads": [
      {
        "label": "Télécharger",
        "url": "https://mecalac.com/fr/api_download/5184/MECALAC-Leaflet-MCR_SERIE-MCR-MK375-FR-web.pdf"
      },
      {
        "label": "Télécharger",
        "url": "https://mecalac.com/fr/api_download/10397/MECALAC-Leaflet-Tiltrotator_MR40_MR50_MR60-MR40_MR50_MR60_MWR_MCR_MC_12Series-MK399-FR-web.pdf"
      },
      {
        "label": "Leaflet : MCR SERIE",
        "url": "https://mecalac.com/fr/api_download/5184/MECALAC-Leaflet-MCR_SERIE-MCR-MK375-FR-web.pdf"
      },
      {
        "label": "Leaflet : Tiltrotator MR40 MR50 MR60",
        "url": "https://mecalac.com/fr/api_download/10397/MECALAC-Leaflet-Tiltrotator_MR40_MR50_MR60-MR40_MR50_MR60_MWR_MCR_MC_12Series-MK399-FR-web.pdf"
      }
    ]
  },
  "10mcr": {
    "sourceUrl": "https://mecalac.com/fr/machine/10mcr-2.html",
    "descriptionFr": "La pelle skid 10mcr atteint le maximum en matière de compacité et de performance dans sa catégorie. Depuis plus de 10 ans, les pelles Mecalac MCR accomplissent efficacement toutes sortes de tâches. Nos clients se déplacent à 10 km/h, bénéficient d'une conduite au joystick et profitent d'une compacité imbattable, non seulement à l'arrière mais surtout à l'avant et en hauteur, compacité qui équivaut à celle d'une pelle de 2 tonnes. Notre conception unique est basée sur l'équilibre, la condition sinequanone pour la puissance de levage s'agissant d'un équipement compact. De plus, vous pouvez utiliser nos pelles comme une chargeuse compacte avec toutes ses commandes et ses accessoires, y compris des godets de 0,75m3 (0,98 yd3) qui sont deux fois plus volumineux que ceux des pelles traditionnelles de la même taille. Les pelles MCR de Mecalac vous offrent des avantages en matière de rentabilité qui vous hisseront au-dessus de la concurrence.",
    "images": [
      {
        "path": "/images/products/10mcr/01-86d2b3bc4e1d.png"
      },
      {
        "path": "/images/products/10mcr/02-22e21ac9c5df.png"
      },
      {
        "path": "/images/products/10mcr/03-34b3413e8601.jpg"
      },
      {
        "path": "/images/products/10mcr/04-ed3af50f3a43.jpg"
      },
      {
        "path": "/images/products/10mcr/05-16a3e52eede1.jpg"
      },
      {
        "path": "/images/products/10mcr/06-4df757682f22.jpg"
      },
      {
        "path": "/images/products/10mcr/07-749dc0f527a7.jpg"
      },
      {
        "path": "/images/products/10mcr/08-f077b17a092c.jpg"
      },
      {
        "path": "/images/products/10mcr/09-0b86e6c12e00.jpg"
      },
      {
        "path": "/images/products/10mcr/10-f95fb208553e.svg"
      }
    ],
    "detailSections": [],
    "accessories": [],
    "downloads": [
      {
        "label": "Télécharger",
        "url": "https://mecalac.com/fr/api_download/5184/MECALAC-Leaflet-MCR_SERIE-MCR-MK375-FR-web.pdf"
      },
      {
        "label": "Télécharger",
        "url": "https://mecalac.com/fr/api_download/10397/MECALAC-Leaflet-Tiltrotator_MR40_MR50_MR60-MR40_MR50_MR60_MWR_MCR_MC_12Series-MK399-FR-web.pdf"
      },
      {
        "label": "Leaflet : MCR SERIE",
        "url": "https://mecalac.com/fr/api_download/5184/MECALAC-Leaflet-MCR_SERIE-MCR-MK375-FR-web.pdf"
      },
      {
        "label": "Leaflet : Tiltrotator MR40 MR50 MR60",
        "url": "https://mecalac.com/fr/api_download/10397/MECALAC-Leaflet-Tiltrotator_MR40_MR50_MR60-MR40_MR50_MR60_MWR_MCR_MC_12Series-MK399-FR-web.pdf"
      }
    ]
  },
  "7mwr": {
    "sourceUrl": "https://mecalac.com/fr/machine/7mwr.html",
    "descriptionFr": "La pelle sur pneus 7MWR est la porte d'entrée de la gamme qui vous ouvre sur tout un nouveau monde de possibilités. La fusion des atouts des pelles sur pneus et sur chenilles a donné naissance à une solution Mecalac unique, conjuguant mobilité, polyvalence, stabilité, accessibilité, facilité d'utilisation, force de levage et donc rentabilité. Voici la gamme unique des MWR. La 7MWR est la pelle sur pneus la plus compacte dans la catégorie des 7 tonnes, avec un diamètre de giration total inégalé de 2659 mm (8'8''), équivalent à celui d'une pelle de 2 tonnes. Et ceci sans négliger la performance : une puissance moteur de 55 kW (75 ch), des aptitudes exceptionnelles en tout-terrain, des capacités de godets de 0,54 m³ (0,70 yd³) et de levage jusqu'à 3 t (6 600 lbs) à 360°.",
    "images": [
      {
        "path": "/images/products/7mwr/01-f6e8fe97cb2d.png"
      },
      {
        "path": "/images/products/7mwr/02-f765a9eea307.png"
      },
      {
        "path": "/images/products/7mwr/03-f958742a3a15.png"
      },
      {
        "path": "/images/products/7mwr/04-d11ff41ea532.png"
      },
      {
        "path": "/images/products/7mwr/05-e7b08f3ac9cb.png"
      },
      {
        "path": "/images/products/7mwr/06-36cf605a511c.png"
      },
      {
        "path": "/images/products/7mwr/07-1044638290e5.png"
      },
      {
        "path": "/images/products/7mwr/08-e9c16fcb8469.png"
      },
      {
        "path": "/images/products/7mwr/09-8f0879f1b2fd.svg"
      }
    ],
    "detailSections": [],
    "accessories": [],
    "downloads": [
      {
        "label": "Télécharger",
        "url": "https://mecalac.com/fr/api_download/5213/MECALAC-Leaflet-MWR_SERIE-7MWR_9MWR_11MWR-MK360-FR-web.pdf"
      },
      {
        "label": "Télécharger",
        "url": "https://mecalac.com/fr/api_download/10397/MECALAC-Leaflet-Tiltrotator_MR40_MR50_MR60-MR40_MR50_MR60_MWR_MCR_MC_12Series-MK399-FR-web.pdf"
      },
      {
        "label": "Leaflet : MWR SERIE",
        "url": "https://mecalac.com/fr/api_download/5213/MECALAC-Leaflet-MWR_SERIE-7MWR_9MWR_11MWR-MK360-FR-web.pdf"
      },
      {
        "label": "Leaflet : Tiltrotator MR40 MR50 MR60",
        "url": "https://mecalac.com/fr/api_download/10397/MECALAC-Leaflet-Tiltrotator_MR40_MR50_MR60-MR40_MR50_MR60_MWR_MCR_MC_12Series-MK399-FR-web.pdf"
      }
    ]
  },
  "9mwr": {
    "sourceUrl": "https://mecalac.com/fr/machine/9mwr.html",
    "descriptionFr": "La pelle sur pneus 9MWR conserve le même concept que la 7MWR pour une stabilité maximale, tout en offrant des performances accrues et le meilleur rapport compacité/ performance. La fusion des atouts des pelles sur pneus et sur chenilles a donné naissance à une solution Mecalac unique, conjuguant mobilité, polyvalence, stabilité, accessibilité, facilité d'utilisation, force de levage et donc rentabilité. Voici la gamme unique des MWR. La 9MWR est une pelle sur pneus unique de 8 tonnes. Elle conserve le concept MWR, offrant une compacité inégalée avec un diamètre de giration total de 2866 mm (9'5''), équivalent à celui d'une pelle de 3 tonnes et presque 2 fois plus petit que celui de ses concurrents directs. Comme la version 7MWR, elle présente des capacités tout-terrain exceptionnelles et des capacités de levage allant jusqu'à 3 tonnes (6 600 lbs) à 360°. La pelle 9MWR bénéficie d’une force de pénétration et d’une force de cavage accrues, d’une performance hydraulique supérieure avec un débit plus important et la capacité de manipuler des godets de 0,57 m³ (0,75 yd³).",
    "images": [
      {
        "path": "/images/products/9mwr/01-17cb06088780.png"
      },
      {
        "path": "/images/products/9mwr/02-fb867441412e.png"
      },
      {
        "path": "/images/products/9mwr/03-7664295bef82.png"
      },
      {
        "path": "/images/products/9mwr/04-870d10ea52ff.png"
      },
      {
        "path": "/images/products/9mwr/05-cea40e6646de.png"
      },
      {
        "path": "/images/products/9mwr/06-6b2e7c670190.jpg"
      },
      {
        "path": "/images/products/9mwr/07-bcf2a281c226.jpg"
      },
      {
        "path": "/images/products/9mwr/08-246db40d0413.jpg"
      },
      {
        "path": "/images/products/9mwr/09-491c9cfeea9f.jpg"
      },
      {
        "path": "/images/products/9mwr/10-5068cdc189a5.jpg"
      },
      {
        "path": "/images/products/9mwr/11-cf2947dd69ee.jpg"
      },
      {
        "path": "/images/products/9mwr/12-edbcbe4f03e5.jpg"
      },
      {
        "path": "/images/products/9mwr/13-0ccb6806865b.jpg"
      },
      {
        "path": "/images/products/9mwr/14-112f8a5a3605.jpg"
      },
      {
        "path": "/images/products/9mwr/15-a04e16f2c9ce.jpg"
      },
      {
        "path": "/images/products/9mwr/16-fdb696067749.jpg"
      },
      {
        "path": "/images/products/9mwr/17-d08b54afe651.jpg"
      },
      {
        "path": "/images/products/9mwr/18-8b500394f5a6.jpg"
      },
      {
        "path": "/images/products/9mwr/19-fc758941e217.jpg"
      },
      {
        "path": "/images/products/9mwr/20-0b7ffbad516d.jpg"
      },
      {
        "path": "/images/products/9mwr/21-2d20f4b7ff49.jpg"
      },
      {
        "path": "/images/products/9mwr/22-a4dbef005ee0.jpg"
      },
      {
        "path": "/images/products/9mwr/23-fe4e92e1585a.jpg"
      },
      {
        "path": "/images/products/9mwr/24-e20920c593b5.jpg"
      },
      {
        "path": "/images/products/9mwr/25-62112edc98ce.jpg"
      },
      {
        "path": "/images/products/9mwr/26-bd2af33cc4ea.jpg"
      },
      {
        "path": "/images/products/9mwr/27-98eff89e64e7.jpg"
      },
      {
        "path": "/images/products/9mwr/28-7b76d74ccc74.jpg"
      },
      {
        "path": "/images/products/9mwr/29-e94f8467b5bd.jpg"
      },
      {
        "path": "/images/products/9mwr/30-ce1349bfe0bf.jpg"
      },
      {
        "path": "/images/products/9mwr/31-75642053135f.jpg"
      },
      {
        "path": "/images/products/9mwr/32-f0474178f576.jpg"
      },
      {
        "path": "/images/products/9mwr/33-bba2c0e48df9.jpg"
      },
      {
        "path": "/images/products/9mwr/34-6d8cebd9034b.jpg"
      },
      {
        "path": "/images/products/9mwr/35-fb4a29fb930b.jpg"
      },
      {
        "path": "/images/products/9mwr/36-a2dc0e5caa49.jpg"
      },
      {
        "path": "/images/products/9mwr/37-ed3fcc3ff107.jpg"
      },
      {
        "path": "/images/products/9mwr/38-05a32c2fffa2.jpg"
      },
      {
        "path": "/images/products/9mwr/39-db9b52272c66.jpg"
      },
      {
        "path": "/images/products/9mwr/40-c927ff0ba916.jpg"
      },
      {
        "path": "/images/products/9mwr/41-0f68145927c1.jpg"
      },
      {
        "path": "/images/products/9mwr/42-c2a3b51dc99d.jpg"
      },
      {
        "path": "/images/products/9mwr/43-95c148e5d07d.jpg"
      },
      {
        "path": "/images/products/9mwr/44-f4679fc2e7f9.jpg"
      },
      {
        "path": "/images/products/9mwr/45-3ea1a1f83044.jpg"
      },
      {
        "path": "/images/products/9mwr/46-c2f110a7cddd.jpg"
      },
      {
        "path": "/images/products/9mwr/47-6d2601792644.jpg"
      },
      {
        "path": "/images/products/9mwr/48-6d414b172c6c.jpg"
      },
      {
        "path": "/images/products/9mwr/49-5dde0fcf979f.jpg"
      },
      {
        "path": "/images/products/9mwr/50-633caa4259c5.png"
      },
      {
        "path": "/images/products/9mwr/51-22b643ca422f.svg"
      }
    ],
    "detailSections": [],
    "accessories": [],
    "downloads": [
      {
        "label": "Télécharger",
        "url": "https://mecalac.com/fr/api_download/5213/MECALAC-Leaflet-MWR_SERIE-7MWR_9MWR_11MWR-MK360-FR-web.pdf"
      },
      {
        "label": "Télécharger",
        "url": "https://mecalac.com/fr/api_download/10397/MECALAC-Leaflet-Tiltrotator_MR40_MR50_MR60-MR40_MR50_MR60_MWR_MCR_MC_12Series-MK399-FR-web.pdf"
      },
      {
        "label": "Leaflet : MWR SERIE",
        "url": "https://mecalac.com/fr/api_download/5213/MECALAC-Leaflet-MWR_SERIE-7MWR_9MWR_11MWR-MK360-FR-web.pdf"
      },
      {
        "label": "Leaflet : Tiltrotator MR40 MR50 MR60",
        "url": "https://mecalac.com/fr/api_download/10397/MECALAC-Leaflet-Tiltrotator_MR40_MR50_MR60-MR40_MR50_MR60_MWR_MCR_MC_12Series-MK399-FR-web.pdf"
      }
    ]
  },
  "11mwr": {
    "sourceUrl": "https://mecalac.com/fr/machine/11mwr.html",
    "descriptionFr": "La pelle sur pneus 11MWR conserve le concept MWR pour une stabilité maximale, avec des performances encore plus élevées, une expérience utilisateur de premier ordre et une mobilité accrue, tout en restant la plus compacte de sa catégorie. La fusion des atouts des pelles sur pneus et sur chenilles a donné naissance à une solution Mecalac unique, conjuguant mobilité, polyvalence, stabilité, accessibilité, facilité d'utilisation, force de levage et donc rentabilité. Voici la gamme unique des MWR. La 11MWR offre une expérience utilisateur supérieure par rapport aux pelles traditionnelles sur pneus de 10 tonnes. Elle conserve le concept MWR pour une compacité inégalée, avec un diamètre de giration total de 3291 mm (10'9''), soit environ 30 % plus petit que la moyenne de ses concurrents directs. Comme tous les modèles MWR, elle dispose de capacités tout-terrain exceptionnelles avec un rayon de braquage minimum et une garde au sol maximale. Les performances ne sont pas en reste, ses capacités de levage vont jusqu'à 4 tonnes (8 820 lbs) à 360° et elle peut travailler avec des godets de 0,82 m³ (1,07 yd³).",
    "images": [
      {
        "path": "/images/products/11mwr/01-a2fd11ea8213.png"
      },
      {
        "path": "/images/products/11mwr/02-5f505d5f535b.png"
      },
      {
        "path": "/images/products/11mwr/03-2d2e72a3bb41.png"
      },
      {
        "path": "/images/products/11mwr/04-97989b4e371f.png"
      },
      {
        "path": "/images/products/11mwr/05-79fc69a7b9d8.png"
      },
      {
        "path": "/images/products/11mwr/06-875dcff14213.png"
      },
      {
        "path": "/images/products/11mwr/07-dbb6fdb2ac58.jpg"
      },
      {
        "path": "/images/products/11mwr/08-e8fda3aad5f6.jpg"
      },
      {
        "path": "/images/products/11mwr/09-d34e226f74c8.jpg"
      },
      {
        "path": "/images/products/11mwr/10-8c922d802587.jpg"
      },
      {
        "path": "/images/products/11mwr/11-8562f2103ca3.jpg"
      },
      {
        "path": "/images/products/11mwr/12-b758c40a56c1.jpg"
      },
      {
        "path": "/images/products/11mwr/13-02b6e51bd1ef.jpg"
      },
      {
        "path": "/images/products/11mwr/14-6d6b68d5b4af.jpg"
      },
      {
        "path": "/images/products/11mwr/15-cdbbb2ba8811.jpg"
      },
      {
        "path": "/images/products/11mwr/16-8ee91f7960be.jpg"
      },
      {
        "path": "/images/products/11mwr/17-2b948ce264da.jpg"
      },
      {
        "path": "/images/products/11mwr/18-be0bf7c7cb1f.jpg"
      },
      {
        "path": "/images/products/11mwr/19-cd320b22894c.jpg"
      },
      {
        "path": "/images/products/11mwr/20-38dca392bc15.jpg"
      },
      {
        "path": "/images/products/11mwr/21-dec7bb649ce8.jpg"
      },
      {
        "path": "/images/products/11mwr/22-ee9f7b8bbe2a.jpg"
      },
      {
        "path": "/images/products/11mwr/23-7b2584ed5ae6.jpg"
      },
      {
        "path": "/images/products/11mwr/24-b2c74b348fac.jpg"
      },
      {
        "path": "/images/products/11mwr/25-385c055c0fbb.jpg"
      },
      {
        "path": "/images/products/11mwr/26-36a357616543.jpg"
      },
      {
        "path": "/images/products/11mwr/27-9f6ef02a16e2.jpg"
      },
      {
        "path": "/images/products/11mwr/28-19d8cd5401e5.jpg"
      },
      {
        "path": "/images/products/11mwr/29-e85863fae6f4.jpg"
      },
      {
        "path": "/images/products/11mwr/30-95d2b52d206a.jpg"
      },
      {
        "path": "/images/products/11mwr/31-b29b54eeada7.jpg"
      },
      {
        "path": "/images/products/11mwr/32-5b915f9b0e8e.jpg"
      },
      {
        "path": "/images/products/11mwr/33-fd2cc660f628.jpg"
      },
      {
        "path": "/images/products/11mwr/34-f0b5c8416b45.jpg"
      },
      {
        "path": "/images/products/11mwr/35-32da73da270d.jpg"
      },
      {
        "path": "/images/products/11mwr/36-3128ea1d386d.jpg"
      },
      {
        "path": "/images/products/11mwr/37-c2c9c0e95e31.jpg"
      },
      {
        "path": "/images/products/11mwr/38-943e25203de2.jpg"
      },
      {
        "path": "/images/products/11mwr/39-9ce39338c635.jpg"
      },
      {
        "path": "/images/products/11mwr/40-1c122cf19226.jpg"
      },
      {
        "path": "/images/products/11mwr/41-85a6f122ff6f.jpg"
      },
      {
        "path": "/images/products/11mwr/42-2e2e2ad6da41.jpg"
      },
      {
        "path": "/images/products/11mwr/43-2b36098ec21e.jpg"
      },
      {
        "path": "/images/products/11mwr/44-fea88d50ea1c.jpg"
      },
      {
        "path": "/images/products/11mwr/45-7c4610c2594b.jpg"
      },
      {
        "path": "/images/products/11mwr/46-f56096c11cfd.jpg"
      },
      {
        "path": "/images/products/11mwr/47-97fcd7d0a13d.jpg"
      },
      {
        "path": "/images/products/11mwr/48-7ddc8881a009.jpg"
      },
      {
        "path": "/images/products/11mwr/49-3e0066281a28.jpg"
      },
      {
        "path": "/images/products/11mwr/50-6814e5aa8382.jpg"
      },
      {
        "path": "/images/products/11mwr/51-62f0b0d6030c.jpg"
      },
      {
        "path": "/images/products/11mwr/52-e12393d32c4a.jpg"
      },
      {
        "path": "/images/products/11mwr/53-50bd5828fab0.jpg"
      },
      {
        "path": "/images/products/11mwr/54-51de4486a467.jpg"
      },
      {
        "path": "/images/products/11mwr/55-e92433cc1731.jpg"
      },
      {
        "path": "/images/products/11mwr/56-3cf19d5488ba.jpg"
      },
      {
        "path": "/images/products/11mwr/57-afa0c060aefe.jpg"
      },
      {
        "path": "/images/products/11mwr/58-1057a5bc8d3e.jpg"
      },
      {
        "path": "/images/products/11mwr/59-b7a2445d4301.png"
      },
      {
        "path": "/images/products/11mwr/60-5b9904a9c4c9.svg"
      }
    ],
    "detailSections": [],
    "accessories": [],
    "downloads": [
      {
        "label": "Télécharger",
        "url": "https://mecalac.com/fr/api_download/5213/MECALAC-Leaflet-MWR_SERIE-7MWR_9MWR_11MWR-MK360-FR-web.pdf"
      },
      {
        "label": "Télécharger",
        "url": "https://mecalac.com/fr/api_download/10397/MECALAC-Leaflet-Tiltrotator_MR40_MR50_MR60-MR40_MR50_MR60_MWR_MCR_MC_12Series-MK399-FR-web.pdf"
      },
      {
        "label": "Leaflet : MWR SERIE",
        "url": "https://mecalac.com/fr/api_download/5213/MECALAC-Leaflet-MWR_SERIE-7MWR_9MWR_11MWR-MK360-FR-web.pdf"
      },
      {
        "label": "Leaflet : Tiltrotator MR40 MR50 MR60",
        "url": "https://mecalac.com/fr/api_download/10397/MECALAC-Leaflet-Tiltrotator_MR40_MR50_MR60-MR40_MR50_MR60_MWR_MCR_MC_12Series-MK399-FR-web.pdf"
      }
    ]
  },
  "15mwr": {
    "sourceUrl": "https://mecalac.com/fr/machine/15mwr.html",
    "descriptionFr": "La pelle sur pneus 15MWR offre un equilibre et une mobilite exceptionnels dans la categorie des 15 tonnes. Grâce à la position abaissée du moteur, de 100 kW/136 ch, et à l'intégration dans le capot de technologies de réduction d’émissions, la 15MWR offre une excellente visibilité et une compacité sans compromis sur la mobilité. Le modèle 15MWR est doté de nombreuses caractéristiques techniques pour une gestion optimale des chantiers de construction sur tous types de terrains :Naturellement équilibré : elle peut lever jusqu'à 8 tonnes (17 636 lbs) à 360°Capacité tout-terrain : garde au sol élevée et équilibreManiabilité : quatre roues directrices, meilleur rayon de braquage de sa catégorie à l'extrémité de la flèche en position route et rayon de rotation arrière de seulement 1571 mm (5’2’’)Compacité : diamètre de giration total imbattable de 2991 mm (9’9’’)... sans oublier la simplicité d'usage, une cabine haut de gamme, un compartiment glacière, un accès pieds au sol pour le ravitaillement en carburant et AdBlue, et bien plus encore.",
    "images": [
      {
        "path": "/images/products/15mwr/01-b777bb6da3fb.png"
      },
      {
        "path": "/images/products/15mwr/02-0f57a2453b65.png"
      },
      {
        "path": "/images/products/15mwr/03-ae5ec12b2184.png"
      },
      {
        "path": "/images/products/15mwr/04-efae37af5011.png"
      },
      {
        "path": "/images/products/15mwr/05-ef4daa732997.png"
      },
      {
        "path": "/images/products/15mwr/06-724050062885.png"
      },
      {
        "path": "/images/products/15mwr/07-cb56c776ffff.png"
      },
      {
        "path": "/images/products/15mwr/08-13dc8dce2a57.png"
      },
      {
        "path": "/images/products/15mwr/09-a6e0dcf73909.png"
      },
      {
        "path": "/images/products/15mwr/10-25179bd46c32.png"
      },
      {
        "path": "/images/products/15mwr/11-5c90d2e8113f.png"
      },
      {
        "path": "/images/products/15mwr/12-b7bbcdf7d67b.png"
      },
      {
        "path": "/images/products/15mwr/13-6d061da33fb1.png"
      },
      {
        "path": "/images/products/15mwr/14-365cdcb57b43.jpg"
      },
      {
        "path": "/images/products/15mwr/15-538c29088888.jpg"
      },
      {
        "path": "/images/products/15mwr/16-7b97bf3d02b3.jpg"
      },
      {
        "path": "/images/products/15mwr/17-48e472cced1a.jpg"
      },
      {
        "path": "/images/products/15mwr/18-a9e367dfd903.jpg"
      },
      {
        "path": "/images/products/15mwr/19-4ba1e0c249d9.jpg"
      },
      {
        "path": "/images/products/15mwr/20-3f69dfe87f82.jpg"
      },
      {
        "path": "/images/products/15mwr/21-4bafe80cfe03.jpg"
      },
      {
        "path": "/images/products/15mwr/22-3bdb767199aa.jpg"
      },
      {
        "path": "/images/products/15mwr/23-18b6e84403b1.jpg"
      },
      {
        "path": "/images/products/15mwr/24-f494a35d5feb.jpg"
      },
      {
        "path": "/images/products/15mwr/25-9ebe61076290.jpg"
      },
      {
        "path": "/images/products/15mwr/26-dfd8c9424fa3.jpg"
      },
      {
        "path": "/images/products/15mwr/27-0882c53f7805.jpg"
      },
      {
        "path": "/images/products/15mwr/28-07421cae75b0.jpg"
      },
      {
        "path": "/images/products/15mwr/29-f1833a14cfc8.jpg"
      },
      {
        "path": "/images/products/15mwr/30-1f21e971c6a8.jpg"
      },
      {
        "path": "/images/products/15mwr/31-c14c0bd9ce06.jpg"
      },
      {
        "path": "/images/products/15mwr/32-93ce88317f7a.jpg"
      },
      {
        "path": "/images/products/15mwr/33-cb282e3578c8.jpg"
      },
      {
        "path": "/images/products/15mwr/34-181c9396e3c0.jpg"
      },
      {
        "path": "/images/products/15mwr/35-a12428a4231e.jpg"
      },
      {
        "path": "/images/products/15mwr/36-9dd9276864ac.jpg"
      },
      {
        "path": "/images/products/15mwr/37-38681ec04e50.jpg"
      },
      {
        "path": "/images/products/15mwr/38-bc4cce6bc336.jpg"
      },
      {
        "path": "/images/products/15mwr/39-2099a914f56f.jpg"
      },
      {
        "path": "/images/products/15mwr/40-558536259a85.jpg"
      },
      {
        "path": "/images/products/15mwr/41-0b3d0c77ed06.jpg"
      },
      {
        "path": "/images/products/15mwr/42-d0a98b2d8d48.jpg"
      },
      {
        "path": "/images/products/15mwr/43-f35b408e745c.jpg"
      },
      {
        "path": "/images/products/15mwr/44-4c72e1aa2c43.jpg"
      },
      {
        "path": "/images/products/15mwr/45-9d8ccec276b9.jpg"
      },
      {
        "path": "/images/products/15mwr/46-82a70f8fe8da.jpg"
      },
      {
        "path": "/images/products/15mwr/47-97caa9f3f06f.jpg"
      },
      {
        "path": "/images/products/15mwr/48-c1631aceb7cb.jpg"
      },
      {
        "path": "/images/products/15mwr/49-dd807bc89417.jpg"
      },
      {
        "path": "/images/products/15mwr/50-7e4856ea0231.jpg"
      },
      {
        "path": "/images/products/15mwr/51-4db599ca2a07.png"
      },
      {
        "path": "/images/products/15mwr/52-7f4ff8e16eeb.svg"
      }
    ],
    "detailSections": [],
    "accessories": [],
    "downloads": [
      {
        "label": "Télécharger",
        "url": "https://mecalac.com/fr/api_download/5205/MECALAC-Leaflet-15MWR-15MWR-MK365-FR-web.pdf"
      },
      {
        "label": "Télécharger",
        "url": "https://mecalac.com/fr/api_download/10397/MECALAC-Leaflet-Tiltrotator_MR40_MR50_MR60-MR40_MR50_MR60_MWR_MCR_MC_12Series-MK399-FR-web.pdf"
      },
      {
        "label": "Leaflet : 15MWR",
        "url": "https://mecalac.com/fr/api_download/5205/MECALAC-Leaflet-15MWR-15MWR-MK365-FR-web.pdf"
      },
      {
        "label": "Leaflet : Tiltrotator MR40 MR50 MR60",
        "url": "https://mecalac.com/fr/api_download/10397/MECALAC-Leaflet-Tiltrotator_MR40_MR50_MR60-MR40_MR50_MR60_MWR_MCR_MC_12Series-MK399-FR-web.pdf"
      }
    ]
  },
  "12mtx": {
    "sourceUrl": "https://mecalac.com/fr/machine/12mtx-1.html",
    "descriptionFr": null,
    "images": [
      {
        "path": "/images/products/12mtx/01-9a39df0ba55b.png"
      },
      {
        "path": "/images/products/12mtx/02-321fed61136a.png"
      },
      {
        "path": "/images/products/12mtx/03-57261887d8da.png"
      },
      {
        "path": "/images/products/12mtx/04-9ebea6995efb.png"
      },
      {
        "path": "/images/products/12mtx/05-d8a4a5efb190.png"
      },
      {
        "path": "/images/products/12mtx/06-81c6ca245c77.png"
      },
      {
        "path": "/images/products/12mtx/07-aa497389c25a.png"
      },
      {
        "path": "/images/products/12mtx/08-fc0cb1a9c356.png"
      },
      {
        "path": "/images/products/12mtx/09-6f076e8adc1c.png"
      },
      {
        "path": "/images/products/12mtx/10-1649c39b425e.png"
      },
      {
        "path": "/images/products/12mtx/11-088e54df571b.png"
      },
      {
        "path": "/images/products/12mtx/12-75e5259ff135.png"
      },
      {
        "path": "/images/products/12mtx/13-40a678e93dcd.svg"
      }
    ],
    "detailSections": [
      {
        "title": "Fonction flottante de la flèche",
        "body": "Cette fonction permet au vérin de la volée variable de bouger librement.",
        "bullets": [
          "Travaux de finition plus rapides et plus faciles",
          "Réduction des contraintes et des vibrations sur l'équipement (par exemple avec une plaque de compactage)"
        ]
      },
      {
        "title": "Suspension de l’équipement",
        "body": "Cette fonction améliore le confort grâce à des accumulateurs situés sur la flèche qui agissent comme des amortisseurs.",
        "bullets": [
          "Moins d'effet rebond",
          "Conduite plus confortable, en particulier à vitesse élevée"
        ]
      },
      {
        "title": "Conduite au manipulateur",
        "body": "Cette fonction permet de diriger la machine directement via le joystick (à faible vitesse, max. 15 km/h - 9.3mph).",
        "bullets": [
          "Repositionnements plus faciles sans avoir à enlever les mains des joysticks"
        ]
      },
      {
        "title": "Frein de travail automatique",
        "body": "Vérouillage automatique du frein et du pont lorsque la machine se met à travailler.",
        "bullets": [
          "Réduit la fatigue",
          "Améliore la productivité"
        ]
      },
      {
        "title": "Réglage des débits et pressions au moniteur",
        "body": "Les débits et les pressions de la ligne haut débit peuvent être réglés directement de la cabine.",
        "bullets": [
          "Changements d'outils facilités et plus rapides"
        ]
      },
      {
        "title": "Ventilateur réversible automatique",
        "body": "Cette fonction inverse périodiquement le flux d'air pour souffler les débris ou la poussière accumulée.",
        "bullets": [
          "Réduit l'encrassement des radiateurs par la poussière et la chaleur dans le système pour plus d'efficacité et de longévité."
        ]
      },
      {
        "title": "L'essence de la 12",
        "body": "Pelle ultime, vrai chargeur, plus un telehandler La meilleur cinématique de bras en porteur d’outils Avec une compacité imbattable ... et maintenant plus disponible pour tous",
        "bullets": [
          "Pelle ultime, vrai chargeur, plus un telehandler",
          "La meilleur cinématique de bras en porteur d’outils",
          "Avec une compacité imbattable",
          "... et maintenant plus disponible pour tous"
        ]
      },
      {
        "title": "The Touch",
        "body": "L’héritage de la 12MTX : se traduit par une extrême compacité (2710 mm - 8'9'' de diamètre de giration), un grand godet chargeur de 750l (0,98 yd³) et une impressionnante performance de levage allant jusqu'à 4t (8,818 lbs) à 360°, avec un puissant moteur de 85kW (115ch). Des options telles que la conduite au manipulateur, la fonction flottante de la flèche ou le Tiltrotator Mecalac augmenteront votre productivité et votre polyvalence à un niveau d'efficacité sans précédent.",
        "bullets": []
      },
      {
        "title": "Nouveau Design",
        "body": "Nouveau design des capots Un capot latéral gauche unique au lieu de deux Nouvelle prise d’air sur le compartiment moteur arrière Nouveau design de l’arceau de protection arrière Nouveau design des protections des feux avant Nouveaux calques",
        "bullets": [
          "Nouveau design des capots",
          "Un capot latéral gauche unique au lieu de deux",
          "Nouvelle prise d’air sur le compartiment moteur arrière",
          "Nouveau design de l’arceau de protection arrière",
          "Nouveau design des protections des feux avant",
          "Nouveaux calques"
        ]
      },
      {
        "title": "Plus deconfort",
        "body": "Sièges Grammer confortables Joysticks ergonomiques, type “MWR” Interface conviviale d’affichage du moniteur et encore plus de possibilités de personnalisation du profil utilisateur Nouveaux ajustements possibles de l'alarme de translation Suppression du blocage manuel de la rotation cabine Commande additionnelle du marche-pied déployable au sol",
        "bullets": [
          "Sièges Grammer confortables",
          "Joysticks ergonomiques, type “MWR”",
          "Interface conviviale d’affichage du moniteur et encore plus de possibilités de personnalisation du profil utilisateur",
          "Nouveaux ajustements possibles de l'alarme de translation",
          "Suppression du blocage manuel de la rotation cabine",
          "Commande additionnelle du marche-pied déployable au sol"
        ]
      },
      {
        "title": "Plus de polyvalence",
        "body": "Pédale d'approche lente en standard (double pédale inching / frein) Ligne hydraulique auxiliaire haute performance pour accessoires (option) Conduite de retour de l'huile de fuite pour accessoires, sans pression (option) Tiltrotator MecalacMR50 (option) 2ème clapet de sécurité sur vérin de godet (option)",
        "bullets": [
          "Pédale d'approche lente en standard (double pédale inching / frein)",
          "Ligne hydraulique auxiliaire haute performance pour accessoires (option)",
          "Conduite de retour de l'huile de fuite pour accessoires, sans pression (option)",
          "Tiltrotator MecalacMR50 (option)",
          "2ème clapet de sécurité sur vérin de godet (option)"
        ]
      },
      {
        "title": "Plus de protection",
        "body": "Protection supérieure avec une homologation ROPS plus élevée Efficacité accrue de l'éclairage route LED Capacités de démarrage renforcées grâce à la nouvelle batterie 12 V Accès facilité aux points de maintenance quotidienne sous un capot unique avec coffre à outils Protection accrue avec garde-boue avant (option) Relocalisation de l'admission d'air du moteur pour plus d'efficacité",
        "bullets": [
          "Protection supérieure avec une homologation ROPS plus élevée",
          "Efficacité accrue de l'éclairage route LED",
          "Capacités de démarrage renforcées grâce à la nouvelle batterie 12 V",
          "Accès facilité aux points de maintenance quotidienne sous un capot unique avec coffre à outils",
          "Protection accrue avec garde-boue avant (option)",
          "Relocalisation de l'admission d'air du moteur pour plus d'efficacité"
        ]
      }
    ],
    "accessories": [
      "Réduction des contraintes et des vibrations sur l'équipement (par exemple avec une plaque de compactage)",
      "Ligne hydraulique auxiliaire haute performance pour accessoires (option)",
      "Conduite de retour de l'huile de fuite pour accessoires, sans pression (option)",
      "Tiltrotator MecalacMR50 (option)",
      "2ème clapet de sécurité sur vérin de godet (option)"
    ],
    "downloads": [
      {
        "label": "Télécharger",
        "url": "https://mecalac.com/fr/api_download/10397/MECALAC-Leaflet-Tiltrotator_MR40_MR50_MR60-MR40_MR50_MR60_MWR_MCR_MC_12Series-MK399-FR-web.pdf"
      },
      {
        "label": "Télécharger",
        "url": "https://mecalac.com/fr/api_download/10625/MECALAC-Leaflet-12_Series_guide-12Series-MK000-FR-web.pdf"
      },
      {
        "label": "Télécharger",
        "url": "https://mecalac.com/fr/api_download/10998/MECALAC-Leaflet-12_Series-12MSX_12MTXG2_12MRX-MK443-FR-web.pdf"
      },
      {
        "label": "Leaflet : Tiltrotator MR40 MR50 MR60",
        "url": "https://mecalac.com/fr/api_download/10397/MECALAC-Leaflet-Tiltrotator_MR40_MR50_MR60-MR40_MR50_MR60_MWR_MCR_MC_12Series-MK399-FR-web.pdf"
      },
      {
        "label": "Leaflet : 12 Series guide",
        "url": "https://mecalac.com/fr/api_download/10625/MECALAC-Leaflet-12_Series_guide-12Series-MK000-FR-web.pdf"
      },
      {
        "label": "Leaflet : 12 Series",
        "url": "https://mecalac.com/fr/api_download/10998/MECALAC-Leaflet-12_Series-12MSX_12MTXG2_12MRX-MK443-FR-web.pdf"
      }
    ]
  },
  "15mc": {
    "sourceUrl": "https://mecalac.com/fr/machine/15mc.html",
    "descriptionFr": "La 15MC, une pelle compacte et puissante qui peut travailler au plus près des chenilles tout en dégageant une amplitude de travail exceptionnelle de 9 m, bénéficie des dernières technologies intérieures et extérieures brevetées Mecalac. Equipée d’un moteur de 100 kW, c’est la machine la plus puissante de sa catégorie. Découvrez maintenant la nouvelle pelle sur chenilles “made in Mecalac“.",
    "images": [
      {
        "path": "/images/products/15mc/01-3103a81d1114.png"
      },
      {
        "path": "/images/products/15mc/02-2c0cefef1f64.png"
      },
      {
        "path": "/images/products/15mc/03-79a652df0c3b.png"
      },
      {
        "path": "/images/products/15mc/04-39c457f537cf.png"
      },
      {
        "path": "/images/products/15mc/05-dd1f40fdae2c.png"
      },
      {
        "path": "/images/products/15mc/06-359026be07ce.png"
      },
      {
        "path": "/images/products/15mc/07-841671af6935.png"
      },
      {
        "path": "/images/products/15mc/08-dba48a49ad60.png"
      },
      {
        "path": "/images/products/15mc/09-37677f6a47e2.jpg"
      },
      {
        "path": "/images/products/15mc/10-2db6da1e6c0a.jpg"
      },
      {
        "path": "/images/products/15mc/11-7325261a4b67.jpg"
      },
      {
        "path": "/images/products/15mc/12-31d39f53b2dd.jpg"
      },
      {
        "path": "/images/products/15mc/13-130fa447f52b.jpg"
      },
      {
        "path": "/images/products/15mc/14-530c1aff3559.jpg"
      },
      {
        "path": "/images/products/15mc/15-9a4f6c700b5f.jpg"
      },
      {
        "path": "/images/products/15mc/16-f65223ac34f3.jpg"
      },
      {
        "path": "/images/products/15mc/17-53ef66758bd8.jpg"
      },
      {
        "path": "/images/products/15mc/18-1bab21945a22.jpg"
      },
      {
        "path": "/images/products/15mc/19-bb58033cc68e.jpg"
      },
      {
        "path": "/images/products/15mc/20-2effd855f326.png"
      },
      {
        "path": "/images/products/15mc/21-c4569552c58f.svg"
      }
    ],
    "detailSections": [],
    "accessories": [],
    "downloads": [
      {
        "label": "Télécharger",
        "url": "https://mecalac.com/fr/api_download/7590/MECALAC-Leaflet-15MC-15MC-MK304-FR-web.pdf"
      },
      {
        "label": "Leaflet : 15MC",
        "url": "https://mecalac.com/fr/api_download/7590/MECALAC-Leaflet-15MC-15MC-MK304-FR-web.pdf"
      }
    ]
  },
  "e12": {
    "sourceUrl": "https://mecalac.com/fr/machine/e12.html",
    "descriptionFr": "L'INNOVATION AU PRÉSENT La version électrique de la 12MTX est inscrite dans l’éthique de Mecalac vers des chantiers urbains toujours plus compacts, performants et respectueux de l’environnement. Parce que l’architecture de la 12MTX thermique la prédestinait naturellement à sa version électrique, l’emplacement du moteur thermique réceptionne désormais une technologie de batteries Lithium Nickel-Manganèse-Cobalt (NMC), idéale pour les solutions embarquées. Cette technologie allie des rapports poids / puissance / qualité largement supérieurs aux batteries classiques à une durée de vie optimisée pour une sécurité totale.",
    "images": [
      {
        "path": "/images/products/e12/01-b09dc89eb6d4.png"
      },
      {
        "path": "/images/products/e12/02-2b425380d1d2.png"
      },
      {
        "path": "/images/products/e12/03-a91e0ac1c27e.png"
      },
      {
        "path": "/images/products/e12/04-f1744c0c58a4.png"
      },
      {
        "path": "/images/products/e12/05-d3eb2fa901dc.png"
      },
      {
        "path": "/images/products/e12/06-52c2bf8a0c2c.png"
      },
      {
        "path": "/images/products/e12/07-f46ae7a41b80.png"
      },
      {
        "path": "/images/products/e12/08-583c3a3912e2.png"
      },
      {
        "path": "/images/products/e12/09-881fd63320ed.jpg"
      },
      {
        "path": "/images/products/e12/10-eab7e3747a1c.jpg"
      },
      {
        "path": "/images/products/e12/11-ac7c931fa710.jpg"
      },
      {
        "path": "/images/products/e12/12-47feec3176c9.jpg"
      },
      {
        "path": "/images/products/e12/13-2c83571694c2.jpg"
      },
      {
        "path": "/images/products/e12/14-a0f4b12c6a24.jpg"
      },
      {
        "path": "/images/products/e12/15-3697257fc36f.jpg"
      },
      {
        "path": "/images/products/e12/16-7499a96b355c.png"
      },
      {
        "path": "/images/products/e12/17-f6057a615f25.svg"
      }
    ],
    "detailSections": [],
    "accessories": [],
    "downloads": [
      {
        "label": "Télécharger",
        "url": "https://mecalac.com/fr/api_download/7697/MECALAC-Leaflet-Zero_Emission-ZE-MK420-FR-web.pdf"
      },
      {
        "label": "Leaflet : Zero Emission",
        "url": "https://mecalac.com/fr/api_download/7697/MECALAC-Leaflet-Zero_Emission-ZE-MK420-FR-web.pdf"
      }
    ]
  }
};
