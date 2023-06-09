import json
import warnings

from lxml import etree

from zira.tools import pycompat
from ..exceptions import except_orm
from ..models import (
    MetaModel,
    BaseModel,
    Model, TransientModel, AbstractModel,

    MAGIC_COLUMNS,
    LOG_ACCESS_COLUMNS,
)

from zira.tools.safe_eval import safe_eval

# extra definitions for backward compatibility
browse_record_list = BaseModel

class BRM(type):
    def __instancecheck__(self, inst):
        warnings.warn(DeprecationWarning(
            "browse_record is a deprecated concept and should not be used "
            "anymore, you can replace `isinstance(o, browse_record)` by "
            "`isinstance(o, BaseModel)`"
        ))
        return isinstance(inst, BaseModel) and len(inst) <= 1
browse_record = BRM('browse_record', (object,), {})

class NBM(type):
    def __instancecheck__(self, inst):
        warnings.warn(DeprecationWarning(
            "browse_record is a deprecated concept and should not be used "
            "anymore, you can replace `isinstance(o, browse_null)` by "
            "`isinstance(o, BaseModel) and not o`"
        ))
        return isinstance(inst, BaseModel) and not inst
browse_null = NBM('browse_null', (object,), {})


def transfer_field_to_modifiers(field, modifiers):
    default_values = {}
    state_exceptions = {}
    for attr in ('invisible', 'readonly', 'required'):
        state_exceptions[attr] = []
        default_values[attr] = bool(field.get(attr))
    for state, modifs in field.get("states",{}).items():
        for modif in modifs:
            if default_values[modif[0]] != modif[1]:
                state_exceptions[modif[0]].append(state)

    for attr, default_value in default_values.items():
        if state_exceptions[attr]:
            modifiers[attr] = [("state", "not in" if default_value else "in", state_exceptions[attr])]
        else:
            modifiers[attr] = default_value


# Don't deal with groups, it is done by check_group().
# Need the context to evaluate the invisible attribute on tree views.
# For non-tree views, the context shouldn't be given.
def transfer_node_to_modifiers(node, modifiers, context=None, in_tree_view=False):
    if node.get('attrs'):
        modifiers.update(safe_eval(node.get('attrs')))

    if node.get('states'):
        if 'invisible' in modifiers and isinstance(modifiers['invisible'], list):
            # TODO combine with AND or OR, use implicit AND for now.
            modifiers['invisible'].append(('state', 'not in', node.get('states').split(',')))
        else:
            modifiers['invisible'] = [('state', 'not in', node.get('states').split(','))]

    for a in ('invisible', 'readonly', 'required'):
        if node.get(a):
            v = bool(safe_eval(node.get(a), {'context': context or {}}))
            if in_tree_view and a == 'invisible':
                # Invisible in a tree view has a specific meaning, make it a
                # new key in the modifiers attribute.
                modifiers['column_invisible'] = v
            elif v or (a not in modifiers or not isinstance(modifiers[a], list)):
                # Don't set the attribute to False if a dynamic value was
                # provided (i.e. a domain from attrs or states).
                modifiers[a] = v


def simplify_modifiers(modifiers):
    for a in ('invisible', 'readonly', 'required'):
        if a in modifiers and not modifiers[a]:
            del modifiers[a]


def transfer_modifiers_to_node(modifiers, node):
    if modifiers:
        simplify_modifiers(modifiers)
        node.set('modifiers', json.dumps(modifiers))

def setup_modifiers(node, field=None, context=None, in_tree_view=False):
    """ Processes node attributes and field descriptors to generate
    the ``modifiers`` node attribute and set it on the provided node.

    Alters its first argument in-place.

    :param node: ``field`` node from an Korajac view
    :type node: lxml.etree._Element
    :param dict field: field descriptor corresponding to the provided node
    :param dict context: execution context used to evaluate node attributes
    :param bool in_tree_view: triggers the ``column_invisible`` code
                              path (separate from ``invisible``): in
                              tree view there are two levels of
                              invisibility, cell content (a column is
                              present but the cell itself is not
                              displayed) with ``invisible`` and column
                              invisibility (the whole column is
                              hidden) with ``column_invisible``.
    :returns: nothing
    """
    modifiers = {}
    if field is not None:
        transfer_field_to_modifiers(field, modifiers)
    transfer_node_to_modifiers(
        node, modifiers, context=context, in_tree_view=in_tree_view)
    transfer_modifiers_to_node(modifiers, node)

def test_modifiers(what, expected):
    modifiers = {}
    if isinstance(what, pycompat.string_types):
        node = etree.fromstring(what)
        transfer_node_to_modifiers(node, modifiers)
        simplify_modifiers(modifiers)
        assert modifiers == expected, "%s != %s" % (modifiers, expected)
    elif isinstance(what, dict):
        transfer_field_to_modifiers(what, modifiers)
        simplify_modifiers(modifiers)
        assert modifiers == expected, "%s != %s" % (modifiers, expected)


# To use this test:
# import zira
# zira.osv.orm.modifiers_tests()
def modifiers_tests():
    test_modifiers('<field name="a"/>', {})
    test_modifiers('<field name="a" invisible="1"/>', {"invisible": True})
    test_modifiers('<field name="a" readonly="1"/>', {"readonly": True})
    test_modifiers('<field name="a" required="1"/>', {"required": True})
    test_modifiers('<field name="a" invisible="0"/>', {})
    test_modifiers('<field name="a" readonly="0"/>', {})
    test_modifiers('<field name="a" required="0"/>', {})
    test_modifiers('<field name="a" invisible="1" required="1"/>', {"invisible": True, "required": True}) # TODO order is not guaranteed
    test_modifiers('<field name="a" invisible="1" required="0"/>', {"invisible": True})
    test_modifiers('<field name="a" invisible="0" required="1"/>', {"required": True})
    test_modifiers("""<field name="a" attrs="{'invisible': [['b', '=', 'c']]}"/>""", {"invisible": [["b", "=", "c"]]})

    # The dictionary is supposed to be the result of fields_get().
    test_modifiers({}, {})
    test_modifiers({"invisible": True}, {"invisible": True})
    test_modifiers({"invisible": False}, {})
