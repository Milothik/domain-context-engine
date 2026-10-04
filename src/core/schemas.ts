export const entitySchema = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "entity",
  "type": "object",
  "required": [
    "@id",
    "@type",
    "name",
    "attributes",
    "relationships",
    "rules",
    "provenance"
  ],
  "properties": {
    "@id": {
      "type": "string",
      "minLength": 1
    },
    "@type": {
      "type": "string"
    },
    "name": {
      "type": "string",
      "minLength": 1
    },
    "attributes": {
      "type": "object"
    },
    "relationships": {
      "type": "array",
      "items": {
        "anyOf": [
          {
            "type": "string",
            "minLength": 1
          },
          {
            "type": "object",
            "required": [
              "to",
              "type"
            ],
            "properties": {
              "to": {
                "type": "string",
                "minLength": 1
              },
              "type": {
                "type": "string",
                "minLength": 1
              },
              "materialEffects": {
                "type": "array",
                "items": {
                  "type": "string",
                  "minLength": 1
                }
              }
            },
            "additionalProperties": false
          }
        ]
      }
    },
    "rules": {
      "type": "object",
      "required": [
        "mustPreserve",
        "mayVary",
        "avoid"
      ],
      "properties": {
        "mustPreserve": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "mayVary": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "avoid": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      },
      "additionalProperties": false
    },
    "provenance": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": [
          "source",
          "type",
          "confidence"
        ],
        "properties": {
          "source": {
            "type": "string",
            "minLength": 1
          },
          "type": {
            "enum": [
              "user-canon",
              "inferred",
              "generated",
              "external",
              "uncertain"
            ]
          },
          "confidence": {
            "type": "number",
            "minimum": 0,
            "maximum": 1
          },
          "locator": {
            "type": "string"
          }
        },
        "additionalProperties": false
      }
    },
    "fieldProvenance": {
      "type": "object",
      "additionalProperties": {
        "type": "array",
        "minItems": 1,
        "items": {
          "type": "object",
          "required": [
            "source",
            "type",
            "confidence"
          ],
          "properties": {
            "source": {
              "type": "string",
              "minLength": 1
            },
            "type": {
              "enum": [
                "user-canon",
                "inferred",
                "generated",
                "external",
                "uncertain"
              ]
            },
            "confidence": {
              "type": "number",
              "minimum": 0,
              "maximum": 1
            },
            "locator": {
              "type": "string"
            }
          },
          "additionalProperties": false
        }
      }
    }
  },
  "additionalProperties": false
} as const;
export const taskSchema = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "task",
  "type": "object",
  "required": [
    "id",
    "prompt",
    "entityIds",
    "tags",
    "must",
    "mustNot",
    "outputRequirements"
  ],
  "properties": {
    "id": {
      "type": "string"
    },
    "prompt": {
      "type": "string"
    },
    "entityIds": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "must": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "mustNot": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "outputRequirements": {
      "type": "object"
    }
  },
  "additionalProperties": false
} as const;
export const contextSchema = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "task-context",
  "type": "object",
  "required": [
    "schemaVersion",
    "task",
    "entities",
    "constraints",
    "relationships",
    "continuity",
    "outputRequirements"
  ],
  "properties": {
    "schemaVersion": {
      "enum": [
        "1.0",
        "2.0"
      ]
    },
    "task": {
      "type": "object",
      "required": [
        "id",
        "prompt",
        "entityIds",
        "tags",
        "must",
        "mustNot",
        "outputRequirements"
      ],
      "properties": {
        "id": {
          "type": "string"
        },
        "prompt": {
          "type": "string"
        },
        "entityIds": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "tags": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "must": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "mustNot": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "outputRequirements": {
          "type": "object"
        }
      },
      "additionalProperties": false
    },
    "entities": {
      "type": "array",
      "items": {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "entity",
        "type": "object",
        "required": [
          "@id",
          "@type",
          "name",
          "attributes",
          "relationships",
          "rules",
          "provenance"
        ],
        "properties": {
          "@id": {
            "type": "string",
            "minLength": 1
          },
          "@type": {
            "type": "string"
          },
          "name": {
            "type": "string",
            "minLength": 1
          },
          "attributes": {
            "type": "object"
          },
          "relationships": {
            "type": "array",
            "items": {
              "anyOf": [
                {
                  "type": "string",
                  "minLength": 1
                },
                {
                  "type": "object",
                  "required": [
                    "to",
                    "type"
                  ],
                  "properties": {
                    "to": {
                      "type": "string",
                      "minLength": 1
                    },
                    "type": {
                      "type": "string",
                      "minLength": 1
                    },
                    "materialEffects": {
                      "type": "array",
                      "items": {
                        "type": "string",
                        "minLength": 1
                      }
                    }
                  },
                  "additionalProperties": false
                }
              ]
            }
          },
          "rules": {
            "type": "object",
            "required": [
              "mustPreserve",
              "mayVary",
              "avoid"
            ],
            "properties": {
              "mustPreserve": {
                "type": "array",
                "items": {
                  "type": "string"
                }
              },
              "mayVary": {
                "type": "array",
                "items": {
                  "type": "string"
                }
              },
              "avoid": {
                "type": "array",
                "items": {
                  "type": "string"
                }
              }
            },
            "additionalProperties": false
          },
          "provenance": {
            "type": "array",
            "minItems": 1,
            "items": {
              "type": "object",
              "required": [
                "source",
                "type",
                "confidence"
              ],
              "properties": {
                "source": {
                  "type": "string",
                  "minLength": 1
                },
                "type": {
                  "enum": [
                    "user-canon",
                    "inferred",
                    "generated",
                    "external",
                    "uncertain"
                  ]
                },
                "confidence": {
                  "type": "number",
                  "minimum": 0,
                  "maximum": 1
                },
                "locator": {
                  "type": "string"
                }
              },
              "additionalProperties": false
            }
          },
          "fieldProvenance": {
            "type": "object",
            "additionalProperties": {
              "type": "array",
              "minItems": 1,
              "items": {
                "type": "object",
                "required": [
                  "source",
                  "type",
                  "confidence"
                ],
                "properties": {
                  "source": {
                    "type": "string",
                    "minLength": 1
                  },
                  "type": {
                    "enum": [
                      "user-canon",
                      "inferred",
                      "generated",
                      "external",
                      "uncertain"
                    ]
                  },
                  "confidence": {
                    "type": "number",
                    "minimum": 0,
                    "maximum": 1
                  },
                  "locator": {
                    "type": "string"
                  }
                },
                "additionalProperties": false
              }
            }
          }
        },
        "additionalProperties": false
      }
    },
    "constraints": {
      "type": "object",
      "required": [
        "must",
        "mustNot",
        "may"
      ],
      "properties": {
        "must": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "mustNot": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "may": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      },
      "additionalProperties": false
    },
    "relationships": {
      "type": "array",
      "items": {
        "type": "object",
        "required": [
          "from",
          "to"
        ],
        "properties": {
          "from": {
            "type": "string"
          },
          "to": {
            "type": "string"
          },
          "type": {
            "type": "string",
            "minLength": 1
          }
        },
        "additionalProperties": false
      }
    },
    "continuity": {
      "type": "array",
      "items": {
        "type": "object",
        "required": [
          "entityId",
          "value",
          "provenance"
        ],
        "properties": {
          "entityId": {
            "type": "string"
          },
          "value": {
            "type": "object"
          },
          "provenance": {
            "type": "array",
            "minItems": 1,
            "items": {
              "type": "object",
              "required": [
                "source",
                "type",
                "confidence"
              ],
              "properties": {
                "source": {
                  "type": "string",
                  "minLength": 1
                },
                "type": {
                  "enum": [
                    "user-canon",
                    "inferred",
                    "generated",
                    "external",
                    "uncertain"
                  ]
                },
                "confidence": {
                  "type": "number",
                  "minimum": 0,
                  "maximum": 1
                },
                "locator": {
                  "type": "string"
                }
              },
              "additionalProperties": false
            }
          },
          "fieldProvenance": {
            "type": "object",
            "additionalProperties": {
              "type": "array",
              "minItems": 1,
              "items": {
                "type": "object",
                "required": [
                  "source",
                  "type",
                  "confidence"
                ],
                "properties": {
                  "source": {
                    "type": "string",
                    "minLength": 1
                  },
                  "type": {
                    "enum": [
                      "user-canon",
                      "inferred",
                      "generated",
                      "external",
                      "uncertain"
                    ]
                  },
                  "confidence": {
                    "type": "number",
                    "minimum": 0,
                    "maximum": 1
                  },
                  "locator": {
                    "type": "string"
                  }
                },
                "additionalProperties": false
              }
            }
          }
        },
        "additionalProperties": false
      }
    },
    "outputRequirements": {
      "type": "object"
    },
    "constraintDetails": {
      "type": "array",
      "items": {
        "type": "object",
        "required": [
          "text",
          "kind",
          "source",
          "priority"
        ],
        "properties": {
          "text": {
            "type": "string",
            "minLength": 1
          },
          "kind": {
            "enum": [
              "must",
              "mustNot",
              "may"
            ]
          },
          "source": {
            "type": "string",
            "minLength": 1
          },
          "priority": {
            "type": "integer",
            "minimum": 0
          }
        },
        "additionalProperties": false
      }
    },
    "knowledgeWarnings": {
      "type": "array",
      "items": {
        "type": "object",
        "required": [
          "entityId",
          "field",
          "reason",
          "provenance"
        ],
        "properties": {
          "entityId": {
            "type": "string"
          },
          "field": {
            "type": "string"
          },
          "reason": {
            "type": "string"
          },
          "provenance": {
            "type": "array",
            "minItems": 1,
            "items": {
              "type": "object",
              "required": [
                "source",
                "type",
                "confidence"
              ],
              "properties": {
                "source": {
                  "type": "string",
                  "minLength": 1
                },
                "type": {
                  "enum": [
                    "user-canon",
                    "inferred",
                    "generated",
                    "external",
                    "uncertain"
                  ]
                },
                "confidence": {
                  "type": "number",
                  "minimum": 0,
                  "maximum": 1
                },
                "locator": {
                  "type": "string"
                }
              },
              "additionalProperties": false
            }
          }
        },
        "additionalProperties": false
      }
    },
    "omittedEntityIds": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "additionalProperties": false,
  "allOf": [
    {
      "if": {
        "properties": {
          "schemaVersion": {
            "const": "2.0"
          }
        },
        "required": [
          "schemaVersion"
        ]
      },
      "then": {
        "required": [
          "constraintDetails",
          "knowledgeWarnings",
          "omittedEntityIds"
        ],
        "properties": {
          "constraintDetails": {},
          "knowledgeWarnings": {},
          "omittedEntityIds": {}
        }
      }
    }
  ]
} as const;
export const decisionsSchema = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "decision-result",
  "type": "array",
  "items": {
    "type": "object",
    "required": [
      "candidate",
      "selected",
      "reason",
      "materialEffects",
      "confidence"
    ],
    "properties": {
      "candidate": {
        "type": "string"
      },
      "selected": {
        "type": "boolean"
      },
      "reason": {
        "type": "string",
        "minLength": 1
      },
      "materialEffects": {
        "type": "array",
        "items": {
          "type": "string"
        }
      },
      "confidence": {
        "type": "number",
        "minimum": 0,
        "maximum": 1
      },
      "evidence": {}
    },
    "additionalProperties": false
  }
} as const;
export const stateSchema = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": [
    "version",
    "facts"
  ],
  "properties": {
    "version": {
      "type": "integer",
      "minimum": 0
    },
    "facts": {
      "type": "array",
      "items": {
        "type": "object",
        "required": [
          "entityId",
          "value",
          "provenance"
        ],
        "properties": {
          "entityId": {
            "type": "string"
          },
          "value": {
            "type": "object"
          },
          "provenance": {
            "type": "array",
            "minItems": 1,
            "items": {
              "type": "object",
              "required": [
                "source",
                "type",
                "confidence"
              ],
              "properties": {
                "source": {
                  "type": "string",
                  "minLength": 1
                },
                "type": {
                  "enum": [
                    "user-canon",
                    "inferred",
                    "generated",
                    "external",
                    "uncertain"
                  ]
                },
                "confidence": {
                  "type": "number",
                  "minimum": 0,
                  "maximum": 1
                },
                "locator": {
                  "type": "string"
                }
              },
              "additionalProperties": false
            }
          },
          "fieldProvenance": {
            "type": "object",
            "additionalProperties": {
              "type": "array",
              "minItems": 1,
              "items": {
                "type": "object",
                "required": [
                  "source",
                  "type",
                  "confidence"
                ],
                "properties": {
                  "source": {
                    "type": "string",
                    "minLength": 1
                  },
                  "type": {
                    "enum": [
                      "user-canon",
                      "inferred",
                      "generated",
                      "external",
                      "uncertain"
                    ]
                  },
                  "confidence": {
                    "type": "number",
                    "minimum": 0,
                    "maximum": 1
                  },
                  "locator": {
                    "type": "string"
                  }
                },
                "additionalProperties": false
              }
            }
          }
        },
        "additionalProperties": false
      }
    }
  },
  "additionalProperties": false
} as const;
export const overridesSchema = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "include": {
      "type": "array",
      "uniqueItems": true,
      "items": {
        "type": "string"
      }
    },
    "exclude": {
      "type": "array",
      "uniqueItems": true,
      "items": {
        "type": "string"
      }
    },
    "locks": {
      "type": "object",
      "additionalProperties": {
        "type": "object"
      }
    },
    "rules": {
      "type": "object",
      "properties": {
        "must": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "mustNot": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      },
      "additionalProperties": false
    },
    "outputRequirements": {
      "type": "object"
    }
  },
  "additionalProperties": false
} as const;
