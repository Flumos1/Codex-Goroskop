# Sample Report: shared compatibility-relationship-type-declaration

- System: shared
- Method family: compatibility-report-framework
- Confidence: medium
- Source rule: rule.compatibility.relationship-type-declaration
- Source IDs: source.goldschneider-complete-compatibility

## Simple Explanation

A compatibility report should first name what kind of relationship is being interpreted.

Romantic partners, spouses, parents and children, friends, coworkers, and business partners need different language because the same tension can mean different things in different roles.

This keeps the report practical and humane: it does not treat every comparison as romance or reduce a family relationship to a single compatibility label.

Reflection: What relationship context is being asked about before any interpretation is generated?

## Advanced Explanation

The compatibility domain requires an explicit relationshipContext field before output. Supported initial contexts include romantic, marriage-long-term, parent-child, mother-child, father-child, friendship, work-business, and family-social.

The generator should select language and axes according to the relationship context, then mark which source system is speaking: Western, personology, Jyotish, Chinese/Eastern, or another source-backed layer.

Do not silently reuse romantic compatibility wording for children, parents, friends, or work relationships.

The public report should translate relationship context into useful questions about care, communication, boundaries, cooperation, and mutual expectations.
